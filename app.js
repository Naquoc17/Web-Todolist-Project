const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
var _ = require('lodash');



const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");



main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-anhquoc:todolistDB@todolistdb.wrslha5.mongodb.net/todolistDB');


    // Item Shema initialize
    const itemsSchema = new mongoose.Schema({
        name: String
    })

    const Item = mongoose.model("Item", itemsSchema);


    const item1 = new Item({
        name: "Welcome to your todolist!"
    })
    const item2 = new Item({
        name: "Hit the + button to add a new item."
    })
    const item3 = new Item({
        name: "<-- Hit this to delete an item."
    })

    // List Schema initialize
    const listSchema = {
        name: String,
        items: [itemsSchema]
    };

    const List = mongoose.model("List", listSchema);



    const defaultItems = [item1, item2, item3];

    let today = date.getDate();


    // Home Route
    app.get("/", function (req, res) {

        Item.find({})
            .then((foundItems) => {
                if (foundItems.length === 0) {
                    Item.insertMany(defaultItems)
                        .then(() => { console.log("Successfully saved default items to DB.") })
                        .catch((err) => { console.log(err) })

                    res.redirect("/");
                } else {
                    res.render("list", { listTitle: today, newListItems: foundItems });
                }
            })
            .catch((err) => {
                console.log(err);
            })
    })



    // Resonse Home Route
    app.post("/", function (req, res) {

        const itemName = req.body.newItem;
        const listName = req.body.list;

        const item = new Item({
            name: itemName
        });

        if (listName === today) {
            item.save();
            res.redirect("/")
        } else {
            List.findOne({name: listName})
                .then((foundList) => {
                    foundList.items.push(item);
                    foundList.save();
                    res.redirect("/" + listName);
                })
                .catch((err) => {
                    console.log(err);
                })
        }
    })



    // Delete Route
    app.post("/delete", function (req, res) {
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;


        if (listName === today) {
            Item.findByIdAndRemove({ _id: checkedItemId })
                .then(() => {
                    console.log("Successfully removed")
                    res.redirect("/");
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
                .then((foundList) => {
                    console.log("removed successfully")
                    res.redirect("/" + listName)
                })
                .catch((err) => {
                    console.log(err);
                })
        }
    })



    // Dynamic Route
    app.get("/:customListName", function (req, res) {
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({ name: customListName })
            .then((foundList) => {
                if (!foundList) {
                    console.log("Doesn't exist!");

                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    })
                    list.save();

                    res.redirect("/" + customListName);
                } else {
                    res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
                }
            })
            .catch((err) => {
                console.log(err);
            })
    })


}


// app.get("/about", function(req, res){
//   res.render("about");
// });



let port = process.env.PORT;
if (port == null || port = ""){
    port = 3000;
}

app.listen(port, function () {
    console.log("Server is ready.");
})

