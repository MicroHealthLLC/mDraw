# Realtime WhiteBoard Collaboration Tool #
- - - -

### About ###
The app is a Realtime Whiteboard Collaborative Tool for discussion for any project
from research to concept mapping. Currently, the server acts as a message broadcaster using socket.io, i.e. it receives a message from the client and sends it out to all other clients.It consist of 3 parts that you can choose:

* Shapes
  * Element
    * Rectangle
    * Circle
    * Triangle
    * Text
    * Line
    * Path
* Controls
  * Element
    * Label
    * Button
    * Text Box
    * Check Box
    * Radio Button
    * SelectBox
    * List
    * Password
    * Scroll Bar
* Componets
  * Element
    * Table
    * Div
    * Image
    * Slider
    * Progress Bar

### Client API
> sendDrawMsg = function call();
    responsible for sending data and coordinates in the html canvas from the client to
    the server. Passing it to the server function eventDraw.

### Frameworks/Technologies Used
  * NodeJs
  * ExpressJs
  * Redis
  * Jade

### Running the App
1. Download and Install the current version for [node] (http://nodejs.org)
2. Downlaod and Install Redis Server
    > * For [Windows](https://github.com/dmajkic/redis/downloads)
    > * For Ubuntu]  - sudo apt-get install redis-server
    > * For [Mac] (http://redis.io/download)
3. On the Root Folder install node module dependencies
    > npm install
4. Run the App
    > node app.js

**Now you can open the http://localhost:8000 to open the home page.**
