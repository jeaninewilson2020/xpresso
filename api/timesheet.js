const express = require('express'); 
const timesheetRouter = express.Router({ mergeParams: true }); 
const sqlite3 = require('sqlite3'); 
const db = new sqlite3.Database('./database.sqlite'); 

timesheetRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId", 
    {
        $employeeId: req.params.employeeId
    }, 
    (err, timesheets) => {
        if(err) {
            res.sendStatus(404); 
            next(err); 
        } else {
            res.status(200).json({ timesheets: timesheets })
        }
    })
})

timesheetRouter.post('/', (req, res, next) => {
    const hours = req.body.timesheet.hours; 
    //console.log(hours); 
    const rate = req.body.timesheet.rate; 
    const date = req.body.timesheet.date; 
    const employeeId = req.params.employeeId; 
    
//Need to retrieve the employeeId before we can add a timesheet
    const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId'; 
    const employeeValues = { $employeeId: employeeId }; 
    db.get(employeeSql, employeeValues, 
        (err, employee) => {
            if(err) {
                next(err); 
            } else {
                if (!hours || !rate || !date || !employeeId) {
                    return res.sendStatus(404); 
                }
                const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)'; 
                const values = {
                    $hours: hours, 
                    $rate: rate, 
                    $date: date, 
                    $employeeId: req.params.employeeId
                }; 
                db.run(sql, values, function(err) {
                    if(err) {
                        next(err); 
                    } else {
                        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
                        function(error, timesheet) {
                            if(error) {
                                next(error); 
                            } else {
                                res.status(201).json( { timesheet: timesheet })
                            }
                        }); 
                    }
                }); 
            }
        }); 
}); 

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get("SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId", 
  {
      $timesheetId: timesheetId
  }, 
  (err, row) => {
      if(err) {
          next(err); 
      } else if (row) {
          req.timesheet = row; 
          next(); 
      } else {
          res.status(404).send(); 
      }
  })
})

timesheetRouter.put('/:timesheetId', (req, res, next) => {
    const timesheetId = req.params.timesheetId; 
    //console.log(timesheetId);
    const hours = req.body.timesheet.hours; 
   // console.log(hours); 
    const rate = req.body.timesheet.rate; 
    const date = req.body.timesheet.date; 
    const employeeId = req.params.employeeId; 
   // console.log(employeeId); 
    if (!hours || !rate || !date || !employeeId) {
        res.status(400).send(); 
    } else {
        const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId'; 
        const employeeValues = { $employeeId: employeeId }; 
        db.get(employeeSql, employeeValues, (err, employee) => {
            if(err) {
                res.sendStatus(400); 
                next(err); 
            } else if (employee) {
                const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId'; 
                const values = {
                    $hours: hours, 
                    $rate: rate, 
                    $date: date, 
                    $employeeId: employeeId, 
                    $timesheetId: timesheetId
                }
                db.run(sql, values, (err) => {
                    if(err) {
                        res.sendStatus(400); 
                        next(err); 
                    } else {
                        db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId', 
                        {
                            $timesheetId: req.params.timesheetId
                        }, 
                        function(err, timesheet) {
                            if(err) {
                                res.sendStatus(400); 
                                next(err); 
                            } else {
                                res.status(200).json( { timesheet: timesheet })
                            }
                        })
                    }
                })
            }
        })
    }
})

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
    const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId'; 
    const timesheetId = {
        $timesheetId: req.params.timesheetId
    }; 
    db.run(sql, timesheetId, (error) => {
        if(error) {
            res.sendStatus(404); 
            next(error); 
        } else {
            res.sendStatus(204); 
        }
    })
})


module.exports = timesheetRouter; 