const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    city: { type: String, required: true },
    sport: { type: String, required: true },
    skillLevel: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    profileImage: { type: String, default: '' }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    console.log('User pre-save hook triggered for:', this.email);
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hash');
        next();
    }
    console.log('Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    console.log('Comparing password for user:', this.email);
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', result);
    return result;
};

module.exports = mongoose.model('User', userSchema);
