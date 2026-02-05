// --------------------------- ↓ SETTING UP DEPENDENCIES ↓ --------------------------------
require("dotenv").config(); //loads env variables into the server before going live
const express = require("express"); //enables the use of Express.js
const cors = require("cors"); //Enables cross origin resource sharing (Access to fetch at 'http://localhost:3000/get/example' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.)
const mongoose = require("mongoose"); //Enables us to connect and interact with the database

// ---------------------------- ↓ INITIAL APP CONFIGURATION ↓ -----------------------------
console.log(process.env.MONGO_URI);
const app = express(); //Using express.js to power our application/server
const port = process.env.PORT || 3000; //Uses port number on device to serve the backend

// -------------------------------- ↓ MIDDLEWARE SETUP ↓ -----------------------------------
app.use(express.json());

app.use(cors("*")); //don't ever enable this in Live sites, it's purely for testing - it allows all sites to access the server

// -------------------------------- ↓ DATABASE CONNECTION AND APP STARTUP ↓ -----------------------------------

//Start the server - Immediately Invoked Function Expression (IIFE)
(async () => {
  try {
    mongoose.set("autoIndex", false);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected");

    await Task.syncIndexes();
    console.log(`✅ Indexes created`);

    app.listen(port, () => {
      console.log(`✅ To Do App is live on port ${port}`);
    });
  } catch (err) {
    console.error("Startup Error:", err);
    process.exit(1); //this stops the server running if there is an error
  }
})();

//Define the task schema (Data Structure)
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  dateCreated: { type: Date, required: true, default: Date.now },
  completed: { type: Boolean, required: true, default: false },
});

//Define indexes for performance optimisation and sorting
taskSchema.index({ dueDate: 1 }); //-1 is descending and 1 is ascending
taskSchema.index({ dateCreated: 1 });

//Database Model

//Type of data structure to be used in database
const Task = mongoose.model("Task", taskSchema); //create the model using the taskScheme schema

// ---------------------------------- ↓ API ROUTES ↓ ---------------------------------------

//http://localhost:3000/get/example
//need to connect this in front end via api.js
//Option 1:
/*app.get("/get/example", async (req, res) => {
        res.send("Hello, I am a message from the backend");
});

//Option 2:
app.get("/get/example", async (req, res) => {
        res.json({message: "Hello", success: true, multiValues: ["blue", "green", "white"] });
});
*/

//------ APIS -----//

//Get all Tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const { sortBy } = req.query;
    let sortOption = {};

    if (sortBy == "dueDate") {
      sortOption = { dueDate: 1 }; //ascending
    } else if (sortBy == "dateCreated") {
      sortOption = { dateCreated: 1 }; //ascending
    }

    const tasks = await Task.find({}).sort(sortOption);

    if (!tasks) {
      return res.status(404).json({ message: "Tasks not found" });
    }

    res.json(tasks);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error grabbing tasks!" });
  }
});

//Create a new task and add it to the array
app.post("/api/tasks/todo", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    const taskData = { title, description, dueDate };
    const createTask = new Task(taskData);
    const newTask = await createTask.save();

    res.json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error creating tasks!" });
  }
});

// Complete the task
app.patch("/api/tasks/complete/:id", async (req, res) => {
  try {
    const { completed } = req.body;
    const taskId = req.params.id;

    const completedTask = await Task.findByIdAndUpdate(
      taskId,
      { completed },
      { new: true },
    );

    if (!completedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task: completedTask, message: "Task set to 'complete." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error completing the task!" });
  }
});

// Uncomplete the task
app.patch("/api/tasks/notComplete/:id", async (req, res) => {
  try {
    const { completed } = req.body;
    const taskId = req.params.id;

    const taskNotComplete = await Task.findByIdAndUpdate(
      taskId,
      { completed },
      { new: true },
    );

    if (!taskNotComplete) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task: taskNotComplete, message: "Task set to ' not complete." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error setting task to not complete!" });
  }
});

//To delete the task
app.delete("/api/tasks/delete/:id", async (req, res) => {
  try {
    const taskId = req.params.id;

    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }

    res.json({ task: deletedTask, message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error deleting the task!" });
  }
});

//to edit the task and update the details
app.put("/api/tasks/update/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, dueDate } = req.body;

    const taskData = { title, description, dueDate };
    const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, {
      new: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }

    res.json({ task: updatedTask, message: "Task updated successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error updating the task!" });
  }
});
