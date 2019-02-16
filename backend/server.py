from flask import Flask, request
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api, reqparse
from json import dumps
from flask_jsonpify import jsonify
from pymongo import MongoClient, GEO2D
from gridfs import GridFS
from bson import objectid
from bson.code import Code
from bson.son import SON
import json
from time import mktime
from datetime import datetime

# Helpers
def getTimestampForBeginningOfYear(year):
	date = "01/01/" + str(year)
	return int(mktime(datetime.strptime(date, "%d/%m/%Y").timetuple()))

def getTimestampForEndOfYear(year):
	date = "31/12/" + str(year)
	return int(mktime(datetime.strptime(date, "%d/%m/%Y").timetuple()))

# MapReduce
mapf = Code('''
	function() {  
		emit(this.node, {count: 1, temp: this.temperature});
	} ''')

reducef = Code('''
	function(node, temperatures) { 
		var value = {
			count: 0, 
			temp: 0
		}; 
		for (var idx = 0; idx < temperatures.length; idx++) {
			value.count += temperatures[idx].count;
			value.temp += temperatures[idx].temp;
		}
		return value; 
	} ''')

finalisef = Code('''
	function(node, value) {
		if(value.count > 0) { 
			value.average = (value.temp / value.count).toFixed(2); 
		} 
		return value; 
	}''')

def createAverageTemperaturesCollection():
	db.sensors.map_reduce(map=mapf, reduce=reducef, out=SON([("replace", "averageTemperatures")]), finalize=finalisef)

def createGeospatialCollection():
	db.coordinates.drop()
	coordinates = []
	for doc in db.datasetPositions.find(): 
		newDoc = {
			"_id" : doc["_id"],
			"geoLocation": [float(doc["coordinate"]["x"]), float(doc["coordinate"]["y"])],
			"label": doc["label"],
			"type": doc["type"]
		}
		coordinates.append(newDoc)
	db.coordinates.insert_many(coordinates)
	db.coordinates.create_index([("geoLocation", GEO2D)], min=-1000, max=1000)

# Initialisation
app = Flask(__name__)
api = Api(app)

with open('../datasets/DatasetPositions.json') as f:
    datasetPositions = json.load(f)

with open('../datasets/Events.json') as f:
    events = json.load(f)

with open('../datasets/Sensors.json') as f:
    sensors = json.load(f)

# Create connection to the database
client = MongoClient()
with client:
	db = client.db
	
	db.datasetPositions.drop()
	db.events.drop()
	db.sensors.drop()

	db.datasetPositions.insert_many(datasetPositions)
	db.events.insert_many(events)
	db.sensors.insert_many(sensors)
	createGeospatialCollection()
	createAverageTemperaturesCollection()

CORS(app)

# Functionalities based on the datasetPositions collection

class LastKnownPosition(Resource):
	def get(self, label):
		pipeline = [
			{"$match": {"label": label}}, 
			{"$sort": {"timestamp": -1}}, 
			{"$limit": 1}
		]
		result = db.datasetPositions.aggregate(pipeline)
		return jsonify(list(result))

api.add_resource(LastKnownPosition, '/last-known-position/<label>')

class Labels(Resource):
	def get(self):
		labels = list(db.datasetPositions.distinct("label"))
		labels.sort()
		return labels

api.add_resource(Labels, '/labels')

class NearbyObjects(Resource):
	def get(self, x1, y1, x2, y2):
		query = {"geoLocation": {"$within": {"$box": [[x1, y1], [x2, y2]]}}}
		return list(db.coordinates.find(query))

api.add_resource(NearbyObjects, '/nearby-objects/<int:x1>/<int:y1>/<int:x2>/<int:y2>')

# Functionalities based on the sensors collection

class AverageTemperatures(Resource):
	def get(self):
		return list(db.averageTemperatures.find())

class AverageTemperaturesForNode(Resource):
	def get(self, node):
		query = {"_id": "/" + node}
		return list(db.averageTemperatures.find(query))

class Nodes(Resource):
	def get(self):
		nodes = list(db.averageTemperatures.distinct("_id"))
		nodes.sort()
		formattedNodes = []
		for node in nodes:
			formattedNode = node[1:]
			formattedNodes.append(formattedNode)
		return formattedNodes

api.add_resource(Nodes, '/nodes')
api.add_resource(AverageTemperatures, '/average-temperatures')
api.add_resource(AverageTemperaturesForNode, '/average-temperatures/<node>')

class TemperaturesPerYear(Resource):
	def get(self, year):
		begin = getTimestampForBeginningOfYear(year)
		end = getTimestampForEndOfYear(year)
		pipeline = [
			{"$project": {"timestamp": "$timestamp", "temperature": "$temperature"}},
			{"$sort": {"timestamp": 1}}, 
			{"$match": {"timestamp": {"$gte": begin, "$lte": end}}}
		];
		result = db.sensors.aggregate(pipeline)
		return list(result)

api.add_resource(TemperaturesPerYear, '/temperatures/<int:year>')

if __name__ == '__main__':
	app.run(port=5002)
	