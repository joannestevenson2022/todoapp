// ----------- OBJECTS // -----------

// ----------- GLOBAL VARIABLES // -----------

const url = "http://localhost:3000";

const taskForm = document.getElementById("taskForm");
const toDoList = document.getElementById("toDoList");
const completedList = document.getElementById("completedList");

// ----------- GENERAL FUNCTIONS // -----------
function resetForm() {
  taskForm.reset();
}

// ----------- GENERAL EVENT LISTENERS (TRIGGERS) // -----------
window.addEventListener("DOMContentLoaded", displayTasks); //once the HTML has loaded, then run the displayTasks function
const sortButton = document.getElementById("sortSelect");
sortButton.addEventListener("change", displayTasks);

window.addEventListener("DOMContentLoaded", () => {
  sortButton.value = "default";
});

// ----------- EVENT LISTENERS (TRIGGERS) FOR TASKS // -----------
//when the button is clicked
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNewTask();
});

[toDoList, completedList].forEach((list) => {
  list.addEventListener("click", (event) => {
    if (event.target.classList.contains("done")) {
      const taskId = event.target.getAttribute("data-id");
      completeTask(taskId);
    }

    if (event.target.classList.contains("notDone")) {
      const taskId = event.target.getAttribute("data-id");
      taskNotComplete(taskId);
    }

    if (event.target.classList.contains("delete")) {
      const taskId = event.target.getAttribute("data-id");
      deleteTask(taskId);
    }

    if (event.target.classList.contains("edit")) {
      // Group task data
      const task = {
        id: event.target.getAttribute("data-id"),
        title: event.target.getAttribute("data-title"),
        description: event.target.getAttribute("data-description"),
        dueDate: new Date(event.target.getAttribute("data-due-date")),
      };

      // Group modal elements
      const modal = {
        titleInput: document.getElementById("editTaskName"),
        descriptionInput: document.getElementById("editTaskDescription"),
        dueDateInput: document.getElementById("editDueDate"),
        saveButton: document.getElementById("saveButton"),
      };

      // Fill modal inputs
      modal.titleInput.value = task.title;
      modal.descriptionInput.value = task.description;
      modal.dueDateInput.value = task.dueDate.toISOString().split("T")[0];

      // save changes
      modal.saveButton.addEventListener(
        "click",
        async () => {
          await editTask(task.id);
          bootstrap.Modal.getInstance(
            document.getElementById("editModal"),
          ).hide();
        },
        { once: true },
      );
    }
  });
});

// ----------- TASK FUNCTIONS // -----------

//Display tasks (retrieving and displaying tasks from api.js file (tasks array))
async function displayTasks() {
  const sortBy = sortButton.value; //dueDate, dateCreated, default
  let query = "";
  if (sortBy !== "default") {
    query = `?sortBy=${sortBy}`;
  }

  try {
    const response = await fetch(`${url}/api/tasks${query}`);

    if (!response.ok) {
      throw new Error("Failed to get tasks" + response.status);
    }

    const data = await response.json();

    function formatTask(task) {
      //styling
      const li = document.createElement("li");
      li.classList.add("card", "p-3", "shadow-3", "mt-2");
      const done =
        task.completed === true
          ? "text.decoration: line-through opacity-50"
          : "";

      //create the list item
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <h4 class="${done} col-11">${task.title}</h4>
            <button data-id="${
              task._id
            }" type="button" class="btn-close delete" aria-label="Delete"></button>
         </div>
            <p class="${done}">${task.description}</p>
            <p class="${done}"><strong>Due: </strong>${new Date(
              task.dueDate,
            ).toLocaleDateString()}</p>
            <div class="d-flex justify-content-between align-items-end">
        <div>
        ${
          task.completed
            ? `<button data-id="${task._id}" class="btn btn-main sm-shadow notDone">Not Done</button>`
            : `
            <button data-bs-toggle="modal" data-bs-target="#editModal" data-id="${task._id}" data-title="${task.title}" data-description="${task.description}" data-due-date="${task.dueDate}" class="btn btn-main sm-shadow edit">Edit</button>
            <button data-id="${task._id}" class="btn btn-main sm-shadow done">Done</button>
            `
        }
        </div>
        <p class="m-0 ${done}"><strong>Created on: </strong>${new Date(
          task.dateCreated,
        ).toLocaleDateString()}</p>
        </div>`;
      return li; //exit function and use it
    }

    toDoList.innerHTML = "";
    completedList.innerHTML = "";

    //Save each formatted task into a variable
    data.forEach((task) => {
      const formattedTask = formatTask(task);
      task.completed
        ? completedList.appendChild(formattedTask)
        : toDoList.appendChild(formattedTask);
    });

    resetForm();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Creating a new task
async function createNewTask() {
  const taskDetails = {
    title: taskForm.taskName.value.trim(),
    description: taskForm.taskDescription.value.trim(),
    dueDate: taskForm.dueDate.value,
  };

  if (!taskDetails.title || !taskDetails.description || !taskDetails.dueDate) {
    return alert("All fields required");
  }

  try {
    const response = await fetch(`${url}/api/tasks/todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskDetails),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task:' ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    displayTasks();
  } catch (error) {}
}

//Updating the task (complete)
async function completeTask(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/complete/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete tasK: ${response.status}`);
    }

    const data = await response.json();

    console.log("Task completed", data);

    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
}

//Updating the task (not complete)
async function taskNotComplete(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/notComplete/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: false }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to make the task not complete: ${response.status}`,
      );
    }

    const data = await response.json();

    console.log("Task set to not complete", data);

    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
}

//Delete the task
async function deleteTask(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/delete/${taskId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete the task: ${response.status}`);
    }

    const data = await response.json();

    console.log("Task deleted successfully", data);

    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
}

//To edit the task
async function editTask(taskId) {
  const updatedDetails = {
    title: document.getElementById("editTaskName").value.trim(),
    description: document.getElementById("editTaskDescription").value.trim(),
    dueDate: document.getElementById("editDueDate").value,
  };

  if (
    !updatedDetails.title ||
    !updatedDetails.description ||
    !updatedDetails.dueDate
  ) {
    return alert("All fields required");
  }

  try {
    const response = await fetch(`${url}/api/tasks/update/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedDetails),
    });

    if (!response.ok) {
      throw new Error(`Failed to edit the task:' ${response.status}`);
    }

    const data = await response.json();

    console.log("Edited task:", data);

    displayTasks();
  } catch (error) {
    console.log("Error", error);
  }
}

//Front End End Point
//get the backend API
/*async function exampleAPI () {
  const response = await fetch(`${URL}/get/example`);
  const data = await response.json();

  console.log(data);
}

exampleAPI();*/
