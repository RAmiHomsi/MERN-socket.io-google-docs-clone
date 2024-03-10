// 1. Import packages
const express = require("express");
const mongoose = require("mongoose");
const Document = require("./Document");
require("dotenv").config();
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("connected to db");
});

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/client/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

const PORT = process.env.PORT;
const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

//Create Instances & Make Server inside the package
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});

// 3. Create Connection
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    let documentData = null;

    try {
      const document = await Document.findById(documentId);
      if (document) {
        documentData = document.data;
      } else {
        // If document not found, create a new empty one
        await Document.create({ _id: documentId, data: "" });
      }
    } catch (e) {
      console.error("Problem while finding or creating a document", e);
    }
    socket.join(documentId);
    socket.emit("load-document", documentData);
    socket.on("send-delta", (delta) => {
      socket.broadcast.to(documentId).emit("received-delta", delta);
    });
    socket.on("save-document", async (data) => {
      try {
        await Document.findByIdAndUpdate(documentId, { data });
      } catch (e) {
        console.error("Problem while saving document", e);
      }
    });
    console.log("User connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
});
