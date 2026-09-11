const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const Ticket = require("./models/ticket");
const bcrypt = require("bcrypt");
const session = require("express-session");
const app = express();
app.use(session({
    secret: "helpdesk-secret",
    resave: false,
    saveUninitialized: false
}));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));


app.get("/", (req, res) => {
    res.render("home");
});
app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name: name,
        email: email,
        password: hashedPassword
    });
await newUser.save();

req.session.userId = newUser._id;

res.redirect("/ticket");
    
});

app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
    return res.send("Wrong password");
}

req.session.userId = user._id;

res.redirect("/ticket");
   
});
function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    next();
}
function isAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    
    User.findById(req.session.userId)
        .then((user) => {

            if (!user || user.role !== "admin") {
                return res.send("Access denied. Admin only.");
            }

            next();
        })
        .catch((err) => {
            res.send("Error checking admin access");
        });
}
app.get("/admin-login", (req, res) => {
    res.render("admin-login");
});
app.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.send("Admin not found");
    }
if (!user) {
    return res.send("Access denied. Admin only.");
}

if (user.role !== "admin") {
    return res.send("Access denied. Admin only.");
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
    return res.send("Access denied. Admin only.");
}
    

    req.session.userId = user._id;

    res.redirect("/admin");
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("Logout failed");
        }

        res.redirect("/login");
    });
});
app.get("/ticket", isLoggedIn, (req, res) => {
    res.render("ticket");
});
app.post("/ticket", isLoggedIn, async (req, res) => {
    const { subject, description } = req.body;

    const newTicket = new Ticket({
        subject: subject,
        description: description,
        userId: req.session.userId
    });

    await newTicket.save();

    res.send("Ticket submitted successfully");
});
app.get("/tickets", isLoggedIn, async (req, res) => {
    const tickets = await Ticket.find({
        userId: req.session.userId
    });

    res.render("tickets", { tickets });
});
app.get("/admin", isAdmin,async (req, res) => {
    const tickets = await Ticket.find();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status === "Open").length;
    const inProgressTickets = tickets.filter(ticket => ticket.status === "In Progress").length;
    const closedTickets = tickets.filter(ticket => ticket.status === "Closed").length;

    res.render("admin", {
        tickets,
        totalTickets,
        openTickets,
        inProgressTickets,
        closedTickets
    });
});
app.post("/admin/ticket/:id",isAdmin, async (req, res) => {
    const { status } = req.body;

    await Ticket.findByIdAndUpdate(req.params.id, {
        status: status
    });

    res.redirect("/admin");
});
app.post("/admin/ticket/:id/delete",isAdmin, async (req, res) => {
    await Ticket.findByIdAndDelete(req.params.id);

    res.redirect("/admin");
});
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log(err);
    });
app.listen(3000, () => {
    console.log("Server started on port 3000");
});