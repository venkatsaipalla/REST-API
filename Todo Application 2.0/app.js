const express = require("express");
const path = require("path");
const dbpath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error message is ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
//Testing
app.get("/", async (request, response) => {
  console.log("hai hello");
  response.send("hai hello");
});

//API 1
const check_status = (requestQuery) => {
  status_list = ["TO DO", "IN PROGRESS", "DONE"];
  return status_list.includes(requestQuery.status);
};

const check_priority = (requestQuery) => {
  priority_list = ["HIGH", "MEDIUM", "LOW"];
  return priority_list.includes(requestQuery.priority);
};

const check_category = (requestQuery) => {
  category_list = ["WORK", "HOME", "LEARNING"];
  return category_list.includes(requestQuery.category);
};

const check_priority_status = (requestQuery) => {
  return check_priority(requestQuery) && check_status(requestQuery);
};

const check_category_status = (requestQuery) => {
  return check_category(requestQuery) && check_status(requestQuery);
};

const check_category_priority = (requestQuery) => {
  return check_category(requestQuery) && check_priority(requestQuery);
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return hasPriority(requestQuery) && hasStatus(requestQuery);
};
const hasCategoryAndPriority = (requestQuery) => {
  return hasCategory(requestQuery) && hasPriority(requestQuery);
};
const hasCategoryAndStatus = (requestQuery) => {
  return hasCategory(requestQuery) && hasStatus(requestQuery);
};

app.get("/todos/", async (request, response) => {
  let query;
  const { status, search_q = "", priority, category } = request.query;
  let check = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      check = check_priority_status(request.query);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%'
            and priority='${priority}' and status='${status}';`;
      } else {
        response.status(400);
        if (check_priority(request.query)) {
          response.send("Invalid Todo Status");
        } else {
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasCategoryAndStatus(request.query):
      check = check_category_status(request.query);
      console.log(check);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%'
        and category='${category}' and status='${status}';`;
      } else {
        response.status(400);
        if (check_category(request.query)) {
          response.send("Invalid Todo Status");
        } else {
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasCategoryAndPriority(request.query):
      check = check_category_priority(request.query);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%'
        and category='${category}' and priority='${priority}';`;
      } else {
        response.status(400);
        if (check_category(request.query)) {
          response.send("Invalid Todo Priority");
        } else {
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasStatus(request.query):
      check = check_status(request.query);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and status='${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      console.log(query);
      break;
    case hasPriority(request.query):
      check = check_priority(request.query);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%'
            and priority='${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.query):
      check = check_category(request.query);
      if (check === true) {
        query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%'
          and category='${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      check = true;
      query = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%';`;
      break;
  }
  if (check === true) {
    const result = await db.all(query);
    console.log(result);
    response.send(result);
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      id,todo,priority,status,category,due_date as dueDate
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const result = await db.get(getTodoQuery);
  response.send(result);
});
//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    let x = date.split("-");
    let new_date = format(new Date(x[0], x[1] - 1, x[2]), "yyyy-MM-dd");
    const query = `select id,todo,priority,status,category,due_date as dueDate from todo where due_date='${new_date}';`;
    const result = await db.all(query);
    response.send(result);
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (check_priority(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (check_status(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (check_category(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    let x = dueDate.split("-");
    let new_date = format(new Date(x[0], x[1] - 1, x[2]), "yyyy-MM-dd");
    const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}','${new_date}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let check = false;
  let updateColumn = "";
  let updateMessage = "";
  let updateValue = "";
  const requestBody = request.body;
  const {
    status = "",
    todo = "",
    priority = "",
    category = "",
    dueDate = "",
  } = requestBody;
  switch (true) {
    case status !== "":
      check = check_status(requestBody);
      if (check === true) {
        updateColumn = "status";
        updateMessage = "Status Updated";
        updateValue = status;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== "":
      check = check_priority(requestBody);
      if (check === true) {
        updateColumn = "priority";
        updateMessage = "Priority Updated";
        updateValue = priority;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todo !== "":
      check = true;
      updateColumn = "todo";
      updateMessage = "Todo Updated";
      updateValue = todo;
      break;
    case dueDate !== "":
      check = isValid(new Date(requestBody.dueDate));
      if (check === true) {
        updateColumn = "due_date";
        updateMessage = "Due Date Updated";
        let x = dueDate.split("-");
        updateValue = format(new Date(x[0], x[1] - 1, x[2]), "yyyy-MM-dd");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case category !== "":
      check = check_category(requestBody);
      if (check === true) {
        updateColumn = "category";
        updateMessage = "Category Updated";
        updateValue = category;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
  if (check === true) {
    const updateTodoQuery = `
    UPDATE
      todo
    SET
    ${updateColumn}='${updateValue}'
    WHERE
      id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateMessage}`);
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let query = `delete from todo where id=${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
