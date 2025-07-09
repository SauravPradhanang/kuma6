const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
   /* username: {
        type: String,
        required: true,
        default: ''
    },*/
    email: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        //required: true,// creates problem with google login.
    },
    phone: {
        type: String,
        //required: true,
        default: ''
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    street: {
        type: String,
        default: ''
    },
    apartment: {
        type: String,
        default: ''
    },
    zip: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    twoFactorSecret: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'customer'//update to merchantRequest
    },
    merchantProof: [{
        filename: String,
       // default:"maxresdefault.jpg"
    }],
    
    status: {
        type: String,
        default: 'allowed'//update to blocked.
    },
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
    }],
    googleID: {
        type: String,
        default: ''
    },
    bankname:
    {
        type: String,
        default: ''
    },
    banknumber:{
        type: Number,
        default: 0
    }

});

userSchema.index({name: "text", email:"text", phone:"text", street:"text"});


userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});


userSchema.set('toJSON', {
    virtuals: true,
});


exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
