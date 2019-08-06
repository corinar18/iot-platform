IoT Platform - README

Prerequisites:
* MongoDB
* Python
* node v10.16.0
* npm v6.9.0

The first step to running the app is to start the mongo service in a terminal:
* `mongod --config /usr/local/etc/mongod.conf`
In another terminal, start the mongo shell with the command: `mongo`.

To run the backend server:
* `cd backend/`
* `npm install`
* `npm start`

The server will run on http://localhost:3000/.

To run the frontend server:
* `cd frontend/iot-platform`
* `npm install`
* `npm start`

The application will open on http://localhost:4200/.
