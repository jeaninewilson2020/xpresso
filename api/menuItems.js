const express = require('express'); 
const menuItemsRouter = express.Router({ mergeParams: true }); 
const sqlite3 = require('sqlite3'); 
const db = new sqlite3.Database('./database.sqlite'); 

menuItemsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId", 
    {
        $menuId: req.params.menuId
    }, 
    (err, menuItems) => {
        if(err) {
            res.sendStatus(404); 
            next(err); 
        } else {
            res.status(200).json({ menuItems: menuItems })
        }
    })
})

menuItemsRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name; 
    const description = req.body.menuItem.description; 
    const inventory = req.body.menuItem.inventory; 
    const price = req.body.menuItem.price; 
    const menuId = req.params.menuId; 
    //Need to retrieve the appropriate menu before we can create a new menuItem
    const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId'; 
    const menuValue = { $menuId: menuId }; 
    db.get(menuSql, menuValue, 
        (err, menu) => {
            if(err) {
                next(err); 
            } else {
                if (!name || !inventory || !price || !menuId) {
                    return res.sendStatus(404); 
                }
                const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)'; 
                const values = {
                    $name: name, 
                    $description: description, 
                    $inventory: inventory, 
                    $price: price, 
                    $menuId: menuId
                }; 
                db.run(sql, values, function(err) {
                    if(err) {
                        next(err); 
                    } else {
                        db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, 
                        function(error, menuItem) {
                            if(error) {
                                next(error); 
                            } else {
                                res.status(201).json( { menuItem: menuItem })
                            }
                        })
                    }
                })
            }
        })

})

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    db.get("SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId", 
    {
        $menuItemId: menuItemId
    }, 
    (err, row) => {
        if(err) {
            next(err); 
        } else if (row) {
            req.menuItem = row; 
            next(); 
        } else {
            res.sendStatus(404); 
        }
    })
})

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const menuItemId = req.params.menuItemId; 
    const name = req.body.menuItem.name; 
    const description = req.body.menuItem.description; 
    const inventory = req.body.menuItem.inventory; 
    const price = req.body.menuItem.price; 
    const menuId = req.params.menuId; 
    if (!name || !inventory || !price || !menuId) {
        res.sendStatus(400); 
    } else {
        const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId'; 
        const menuValues = { $menuId: menuId }; 
        db.get(menuSql, menuValues, (err, menu) => {
            if(err) {
                res.sendStatus(404); 
                next(err); 
            } else if (menu) {
                const sql = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $menuItemId'; 
                const values = {
                    $name: name, 
                    $description: description, 
                    $inventory: inventory, 
                    $price: price, 
                    $menuId: menuId, 
                    $menuItemId: menuItemId
                }; 
                db.run(sql, values, (err) => {
                    if(err) {
                        res.sendStatus(404); 
                        next(err); 
                    } else {
                        db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId', 
                        {
                            $menuItemId: req.params.menuItemId
                        }, 
                        function(err, menuItem) {
                            if(err) {
                                res.sendStatus(404);
                                next(err); 
                            } else {
                                res.status(200).json({ menuItem: menuItem })
                            }
                        }
                        )
                    }
                })
            }
        })
    }
})

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId'; 
    const menuItemId = {
        $menuItemId: req.params.menuItemId
    }; 
    db.run(sql, menuItemId, (error) => {
        if(error) {
            res.sendStatus(404); 
            next(error); 
        } else {
            res.sendStatus(204); 
        }
    })
})

module.exports = menuItemsRouter; 
