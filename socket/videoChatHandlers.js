const Tutor = require("../models/tutorModel");
const Student = require("../models/studentModel");

const videoChatHandlers = (io, socket, onlineTutors, onlineStudents) => {
  socket.on(
    "initiateCall",
    async ({
      signalData,
      receiver_id,
      from,
      callerName,
      callerAvatar,
      callerUserId,
    }) => {
      console.log(signalData);
      const receiver = onlineTutors[receiver_id] || onlineStudents[receiver_id];
      console.log(receiver?.socketId);
      if (receiver) {
        io.to(receiver?.socketId).emit("incomingCall", {
          from,
          callerData: {
            name: callerName,
            avatar: callerAvatar,
            user_id: callerUserId,
          },
          signalData,
        });
      }
    }
  );
  socket.on("answerCall", ({ signalData, to }) => {
    console.log("Answercalldata", signalData);
    const receiver = onlineTutors[to] || onlineStudents[to];
    console.log(receiver);
    if (receiver) {
      io.to(receiver.socketId).emit("callAccepted", {signalData});
    }
  });
};

module.exports = { videoChatHandlers };
