const express = require('express'); 
const menuRouter = express.Router(); 
const sqlite3 = require('sqlite3'); 
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuItemsRouter = require('./menuItems'); 

menuRouter.use('/:menuId/menu-items', menuItemsRouter); 

menuRouter.get('/', (req, res, next) => {
   db.all("SELECT * FROM Menu", (err, menus) => {
       if(err) {
           next(err); 
       } else {
           res.status(200).json({ menus: menus })
       }
   })
}); 

menuRouter.post('/', (req, res, next) => {
    const title = req.body.menu.title; 
    if(!title) {
        res.sendStatus(400); 
    } else {
        db.run('INSERT INTO Menu (title) VALUES ($title)', 
        {
            $title: title
        }, 
        function (err) {
            if(err) {
                next(err); 
            } else {
                db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, 
                function(error, menu) {
                    if(error) {
                        next(error); 
                    } else {
                        res.status(201).json({ menu: menu })
                    }
                });
            }
        
        });
    }
});

menuRouter.param('menuId', (req, res, next, menuId) => {
    db.get("SELECT * FROM Menu WHERE Menu.id = $menuId", 
    {
        $menuId: menuId
    }, 
    (err, row) => {
        if(err) {
            next(err);
        } else if (row) {
            req.menu = row; 
            next(); 
        } else {
            res.sendStatus(404); 
        }
    }); 
}); 

menuRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({ menu: req.menu })
})

menuRouter.put('/:menuId', (req, res, next) => {
   const menuId = req.params.menuId; 
   const title = req.body.menu.title; 
   if (!title) {
       res.sendStatus(400); 
   } else {
       db.run(`UPDATE Menu SET title = $title WHERE id = $menuId`, 
       {
           $title: title, 
           $menuId: menuId

       }, 
       (err, menu) => {
           if(err) {
               res.sendStatus(404); 
               next(err); 
           } else {
               db.get('SELECT * FROM Menu WHERE id = $menuId', 
               {
                   $menuId: req.params.menuId
               }, 
               function(err, menu) {
                   if(err) {
                       next(err);
                   } else {
                       res.status(200).json({ menu: menu})
                   }
               });
           }
       });
   }
});

menuRouter.delete('/:menuId', (req, res, next) => {
    //Check that the menu has no related menu items 
    const menuId = {
        $menuId: req.params.menuId
    }
    const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId'; 
    db.get(sql, menuId, (err, menuItem) => {
        if(err) {
            next(err); 
        } else if (menuItem) {
           return res.sendStatus(400); 
        } else {
            db.run('DELETE FROM Menu WHERE Menu.id = $menuId', 
            {
                $menuId: req.params.menuId
            }, 
            (err) => {
                if(err) {
                    next(err); 
                } else {
                    res.sendStatus(204); 
                }
            }
            )
        }
    })
})

module.exports = menuRouter; 
