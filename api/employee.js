const express = require('express'); 
const employeeRouter = express.Router(); 
const sqlite3 = require('sqlite3'); 
const timesheetRouter = require('./timesheet');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


employeeRouter.use('/:employeeId/timesheets', timesheetRouter); 

employeeRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1', 
    (err, employees) => {
        if (err) {
            next(err); 
        } else {
            res.status(200).send( { employees: employees }); 
        }
    })
})

//works but not passing the "should create a valid employee" or "should return"
//a 201 status code after employee creation"
employeeRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name; 
    const position = req.body.employee.position; 
    const wage = req.body.employee.wage; 
    const isCurrentEmployee = req.body.employee.isCurrentEmployee; 
    if (!name || !position || !wage || !isCurrentEmployee) {
        res.status(400).send(); 
    } else {
        const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
        'VALUES ($name, $position, $wage, $isCurrentEmployee)'; 
        const values = {
            $name: name, 
            $position: position, 
            $wage: wage, 
            $isCurrentEmployee: isCurrentEmployee
        }
        db.run(sql, values, function (err) {
            if(err) {
                next(err); 
            } else {
                db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, 
                function (err, employee){
                    if(err) {
                        next(err); 
                    } else {
                        res.status(201).send({ employee: employee })
                    }
                })
            }
        })
    }
})


employeeRouter.param('employeeId', (req, res, next, employeeId) => {
   db.get("SELECT * FROM Employee WHERE Employee.id = $employeeId", 
   {
       $employeeId: employeeId
   }, 
   (err, employee) => {
       if(err) {
           next(err);
       } else if (employee) {
           req.employee = employee; 
           next(); 
       } else {
           res.status(404).send(); 
       }
   })
}); 

employeeRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({ employee: req.employee })
}); 

//Doesn't pass should update the employee with the given ID, and "before each" hook
employeeRouter.put('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId; 
    const name = req.body.employee.name;  
    const position = req.body.employee.position; 
    const wage = req.body.employee.wage; 
    const isCurrentEmployee = req.body.employee.isCurrentEmployee; 
    if (!employeeId || !name || !position || !wage || !isCurrentEmployee) {
        res.sendStatus(400); 
    } else {
        db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId', 
        {
            $name: name, 
            $position: position, 
            $wage: wage, 
            $isCurrentEmployee: isCurrentEmployee, 
            $employeeId: employeeId
        }, 
        (err, employee) => {
            if(err) {
                next(err); 
            } else {
                db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', 
                {
                    $employeeId: req.params.employeeId
                }, 
                function(err, employee) {
                    if(err) {
                        next(err); 
                    } else {
                        res.status(200).json({ employee: employee })
                    }
                })
            }
        })
    }
})

employeeRouter.delete('/:employeeId', (req, res, next) => {
    const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId'; 
    const employeeId = {
        $employeeId: req.params.employeeId
    }; 
    db.run(sql, employeeId, (error) => {
        if(error) {
            res.sendStatus(404); 
            next(error); 
        } else {
            db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', 
            {
                $employeeId: req.params.employeeId
            }, 
            (error, employee) => {
                if(error) {
                    next(error); 
                } else {
                    res.status(200).json({ employee: employee})
                }
            })

        }
    })
})



module.exports = employeeRouter; 