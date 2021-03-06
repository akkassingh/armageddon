const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const RequestError = require("../errorTypes/RequestError");

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email address.");
      }
    },
  },
  fullName: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: true, //because of null error
    lowercase: true,
    unique: true,
    minlength: 3,
  },
  password: {
    type: String,
    minlength: 8,
  },
  avatar: String,
  bio: {
    type: String,
    maxlength: 130,
  },
  website: {
    type: String,
    maxlength: 65,
  },
  bookmarks: [
    {
      post: {
        type: Schema.ObjectId,
        ref: "Post",
      },
    },
  ],
  githubId: Number,
  faceBookUserId: String,
  googleUserId: String,
  private: {
    type: Boolean,
    default: false,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  passwordResetTime: {
    type: Number,
  },
  pets: [
    {
      pet: {
        type: Schema.ObjectId,
        ref: "Animal",
      },
      confirmed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  phoneNumber: {
    type: String,
    required: false,
    unique: [true, "A user with this phone number already exists"],
  },
  isFreeWalkAvailable : {
    type : Boolean,
    default : true
  },
  isFreeTrainingSessionAvailable : {
    type : Boolean,
    default : true
  }
},
{
  timestamps: true
});

// UserSchema.pre('save', function (next) {
//   const saltRounds = 10;
//   // Check if the password has been modified
//   if (this.modifiedPaths().includes('password')) {
//     bcrypt.genSalt(saltRounds, (err, salt) => {
//       if (err) return next(err);
//       bcrypt.hash(this.password, salt, (err, hash) => {
//         if (err) return next(err);
//         this.password = hash;
//         next();
//       });
//     });
//   } else {
//     next();
//   }
// });

//------------------------------

UserSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const document = await User.findOne({
        $or: [{ username: this.username }],
        // $or: [{ email: this.email }, { username: this.username }],
      });
      if (document)
        return next(
          new RequestError(
            "A user with that email or username already exists.",
            400
          )
        );
      // await mongoose.model("Followers").create({ user: this._id });
      // await mongoose.model("Following").create({ user: this._id });
    } catch (err) {
      return next((err.statusCode = 400));
    }
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
