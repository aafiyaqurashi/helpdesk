const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    subject: String,
    description: String,
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},
    status: {
        type: String,
        default: "Open"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;