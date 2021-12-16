const Notification = require('../models/Notification');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.retrieveNotifications = async (req, res, next) => {
  let user=undefined;
  if(req.headers.type=="User")
   user = res.locals.user
  else
   user = res.locals.animal
   const notification = await Notification.find({receiver:user._id})
  console.log(notification)

  try {
    const notifications = await Notification.aggregate([
      // {
      //   $match: { receiver: user._id },
      // },
      {
        $match: {
          $or: [{ Userreceiver: user._id  }, { Animalreceiver: user._id }],
          $and: [{ read: false  }],
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderUser',
        },
      },
      {
        $lookup: {
          from: 'animals',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderAnimal',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'Userreceiver',
          foreignField: '_id',
          as: 'Userreceiver',
        },
      },
      {
        $lookup: {
          from: 'animals',
          localField: 'Animalauthor',
          foreignField: '_id',
          as: 'Animalreciever',
        },
      },
      // {
      //   $unwind: '$senderUser',
      // },
      // {
      //   $unwind: '$senderAnimal',
      // },
      // {
      //   $unwind: '$receiver',
      // },
      // Look for the sender's followers
      // {
      //   $lookup: {
      //     from: 'followers',
      //     localField: 'sender._id',
      //     foreignField: 'user',
      //     as: 'senderFollowers',
      //   },
      // },
      // {
      //   $unwind: '$senderFollowers',
      // },
      // // Check for the receiver's id in the sender's followers array
      // {
      //   $addFields: {
      //     isFollowing: {
      //       $in: ['$receiver._id', '$senderFollowers.followers.user'],
      //     },
      //   },
      // },
      {
        $project: {
          read: true,
          notificationType: true,
          isFollowing: true,
          date: true,
          notificationData: true,
          'senderUser.username': true,
          'senderUser.avatar': true,
          'senderUser._id': true,
          'senderAnimal.username': true,
          'senderAnimal.avatar': true,
          'senderAnimal._id': true,
          'Userreceiver._id': true,
          'Animalreciever._id': true,
        },
      },
    ]);
    console.log(notifications)
    return res.send({notifications:notifications});
  } catch (err) {
    next(err);
  }
};

module.exports.readNotifications = async (req, res, next) => {
  let user=undefined;

  try {
    if(req.headers.type=="User"){
    user = res.locals.user
    await Notification.updateMany({ Userreceiver: user._id }, { read: true });
  }
   else{
    user = res.locals.animal
    await Notification.updateMany({ Animalreceiver: user._id }, { read: true });
  }
    return res.send({"success" : true});
  } catch (err) {
    next(err);
  }
};
