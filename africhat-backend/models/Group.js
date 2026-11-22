const mongoose = require("mongoose");

const groupMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "moderator", "member"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [groupMemberSchema],
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    maxMembers: {
      type: Number,
      default: 512,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    }],
    settings: {
      onlyAdminsCanSend: {
        type: Boolean,
        default: false,
      },
      allowReactions: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

groupSchema.index({ createdBy: 1 });
groupSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Group", groupSchema);
