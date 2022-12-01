import bcrypt from "bcrypt"
import mongoose from "mongoose"

const saltRounds = 10;



const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique:true},
    password: {type: String, required: true}
})

userSchema.pre("save", function(next){
    if(this.isNew || this.isModified("password")){
        document = this;

        bcrypt.hash(document.password, saltRounds, (err, hashedPassword) => {
            if (err) {
                next(err);
            } else {
                document.password = hashedPassword;
                next();
            }
        });
    } else {
        next();
    }
})

userSchema.methods.isCorrectPassword = function(candidatePassword, callback){
    bcrypt.compare(candidatePassword, this.password, function(err, same){
        if (err) {
            callback(err)
        } else {
            callback(err, same)
        }
    })
}

module.exports = mongoose.model(`User`, userSchema); 