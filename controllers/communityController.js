const Blog = require('../models/Blog');
const User = require("../models/User");
const Animal = require("../models/Animal");
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Post = require('../models/Post')
const ObjectId = require("mongoose").Types.ObjectId;
const unwantedUserFields = [
    "Userauthor.password",
    "Userauthor.private",
    "Userauthor.confirmed",
    "Userauthor.bookmarks",
    "Userauthor.email",
    "Userauthor.website",
    "Userauthor.bio",
    "Userauthor.githubId",
    "Userauthor.pets",
    "Userauthor.googleUserId",
    "Userauthor.__v"
  ];
  const unwantedAnimalFields = [
    "Animalauthor.mating",
    "Animalauthor.adoption",
    "Animalauthor.playBuddies",
    // "Animalauthor.username",
    "Animalauthor.category",
    "Animalauthor.animal_type",
    "Animalauthor.location",
    "Animalauthor.guardians",
    "Animalauthor.pets",
    "Animalauthor.bio",
    "Animalauthor.animalType",
    "Animalauthor.gender",
    "Animalauthor.breed",
    "Animalauthor.age",
    "Animalauthor.playFrom",
    "Animalauthor.playTo",
    "Animalauthor.servicePet",
    "Animalauthor.spayed",
    "Animalauthor.friendlinessWithHumans",
    "Animalauthor.friendlinessWithAnimals",
    "Animalauthor.favouriteThings",
    "Animalauthor.thingsDislikes",
    "Animalauthor.uniqueHabits",
    "Animalauthor.eatingHabits",
    "Animalauthor.relatedAnimals",
    "Animalauthor.registeredWithKennelClub",
    "Animalauthor.bookmarks",
    "Animalauthor.__v"
  ];

 /*
     * Calculates the haversine distance between point A, and B.
     * @param {Number} lat1 point A's latitude
     * @param {Number} lon1 point A's longitude
     * @param {Number} lat2 point B's latitude
     * @param {Number} lon2 point B's longitude
     * @param {boolean} isMiles If we are using miles, else km.
*/
const haversineDistance = (lat1, lon1, lat2, lon2, isMiles = false) => {
    const toRadian = angle => (Math.PI / 180) * angle;
    const distance = (a, b) => (Math.PI / 180) * (a - b);
    const RADIUS_OF_EARTH_IN_KM = 6371;

    const dLat = distance(lat2, lat1);
    const dLon = distance(lon2, lon1);

    lat1 = toRadian(lat1);
    lat2 = toRadian(lat2);

    // Haversine Formula
    const a =
        Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.asin(Math.sqrt(a));

    let finalDistance = RADIUS_OF_EARTH_IN_KM * c;

    if (isMiles) {
        finalDistance /= 1.60934;
    }

    return finalDistance;
};
// ---------------------------------------- BLOGS ---------------------------------------------
module.exports.createBlog = async (req, res, next) => {
    let user = null
    if(req.headers.type=="User")
    user = res.locals.user;
    else
    user = res.locals.animal;
    try{
        const {
            date,
            thumbnail,
            images,
            text,
            title,
        } = req.body;
        const authorType = req.headers.type;
        const author = user._id;
        const peopleLiked = [];
        const newBlog = new Blog({...req.body, author, authorType, peopleLiked});
        await newBlog.save();
        return res.status(201).send({success: true});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports.likeBlog = async (req, res, next) => {
    let user = null
    if(req.headers.type=="User")
        user = res.locals.user;
    else
        user = res.locals.animal;
    const {blogId} = req.body;
    try {
        const blogDocument = await Blog.findById(blogId, 'peopleLiked likes').lean();
        if (!blogDocument){
            return res.status(404).send({"error" : "Invalid Request!"})
        }
        console.log(blogDocument)
        const isLiked = blogDocument.peopleLiked.some((e) => {
            return e.person.toString() == user._id.toString()
        })
        console.log(isLiked)
        if (isLiked){
            const newLikes = blogDocument.peopleLiked.filter(function (ele) {
                return ele.person.toString() != user._id.toString()
            })
            console.log(newLikes.length)
            await Blog.updateOne({ _id: blogId},{peopleLiked : newLikes, likes : blogDocument.likes - 1});
            return res.status(200).send({"message" : "Disliked the Blog", "success" : true})
        }
        else {
            const obj = {
                person : user._id,
                personType : req.headers.type
            }
            blogDocument.peopleLiked.push(obj)
            await Blog.updateOne({ _id: blogId},{peopleLiked : blogDocument.peopleLiked, likes: blogDocument.likes + 1 });
            return res.status(201).send({"message" : "Liked the Blog", "success" : true})
        }
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.deleteBlog = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {blogId} = req.body;
    const blogDocument = await Blog.findById(blogId, 'author authorType');
    if (!blogDocument){
        return res.status(404).send({"message" : "No such Blog was found!", "success" : false});
    }
    else{
        if (req.headers.type==blogDocument.authorType && user._id.toString() == blogDocument.author.toString()){
            await Blog.deleteOne({ _id: blogId});
            return res.status(200).send({"message" : "Blog was deleted successfully", "success" : true})
        }
        else{
            return res.status(401).send({"message" : "You don't have access to this option", "success" : false})
        }
    }
}

module.exports.getBlogs = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {counter} = req.body;
    try{
        const blogs = await Blog.find({}).populate('peopleLiked.person', 'username avatar email phoneNumber').limit(10).skip(10*counter).lean();
        console.log(blogs)
        return res.send({"blogs" : blogs})
    }
    catch (err){
        console.log(err)
        next(err)
    }
    
}

// ---------------------------------------- GROUPS ---------------------------------------------

module.exports.createGroup = async (req, res, next) => {
    const {avatar, name, coverPhoto} = req.body;
    if (req.headers.type=="User")
        user = res.locals.user
    if (req.headers.type=="Animal")
        user = res.locals.animal
    try{
        const group = new Group({...req.body});
        const groupMember = new GroupMember({
            user : user._id,
            userType : req.headers.type,
            group : group._id,
            isAdmin : true,
            confirmed : true
        })
        await group.save();
        await groupMember.save();
        return res.status(201).send({"message" : "Group created successfully!", "success" : true, "groupId" : group._id});
    }
    catch (err){
        console.log(err);
        next(err);
    }
};

module.exports.changeDescription = async (req, res, next) => {
    const {groupId, description} = req.body;
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    if (!groupId){
        return res.status(400).send({"message" : "Invalid information provided!", "success" : false});
    }
    try{
        const isMember = await GroupMember.findOne({
            user : ObjectId(user._id.toString()),
            group : ObjectId(groupId),
            confirmed : true
        }, 'isAdmin confirmed');
        console.log('TEST',isMember)
        if (!isMember || !isMember.confirmed || !isMember.isAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        else{
            await Group.updateOne({ _id: groupId},{description});
            return res.status(200).send({"message" : "Description was updated successfully", "success" : true});
        }
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

module.exports.updateHashtags = async (req, res, next) => {
    const {hashtags, groupId} = req.body;
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const isMember = await GroupMember.findOne({
            user : ObjectId(user._id.toString()),
            group : ObjectId(groupId),
            confirmed : true
        }, 'confirmed isAdmin')
        if (!isMember || !isMember.confirmed || !isMember.isAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        else{
            await Group.updateOne({ _id: ObjectId(groupId)}, {hashtags});
            return res.status(200).send({"message" : "Hashtags updated successfully!", "success" : true});
        }
    }
    catch (err){
        console.log(err);
        next(err);
    }
}

module.exports.invitePeople = async (req, res, next) => {
    const {userId, groupId, type} = req.body;
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    // type will be either User or Animal
    if (!userId || !groupId){
        return res.status(400).send({"message" : "Invalid information provided!", "success": false});
    }
    try{
        const isMember = await GroupMember.findOne({
            "user" : ObjectId(user._id),
            "group" : ObjectId(groupId),
            "confirmed" : true
        }, '_id');
        if (!isMember){
            return res.status(403).send({"message" : "You don't have the required permissions", "success" : false});
        }
        let userDocument = null;
        if (type == "User"){
            userDocument = await User.findById(userId,'_id');
        }
        else{
            userDocument = await Animal.findById(userId, '_id');
        }
        if (!userDocument){
            return res.status(400).send({"message" : "Invalid information provided!", "success" : false});
        }
        else{
            const group = await Group.findById(groupId,'_id');
            if (!group){
                return res.status(400).send({"message" : "Invalid information provided!", "success" : false});
            }
            const alreadyMember = await GroupMember.findOne({
                user : userId,
                group: groupId
            },'confirmed');
            if (alreadyMember){
                if (alreadyMember.confirmed){
                    return res.status(200).send({"message" : "Already a membe!", "success" : false});
                }
                else{
                    return res.status(200).send({"message" : "Person is already invited to join this group!", "success" : false});
                }
            }
            const groupMember = new GroupMember({
                user : userId,
                userType : type,
                group : groupId,
                isAdmin : false,
                confirmed : false,
                personType: req.headers.type,
                personInvited : user._id
            }); 
            await groupMember.save();
            return res.status(201).send({"message" : "Invitation was sent successfully!", "success" : true});
        }
    }
    catch(err){
        console.log(err)
        next(err)
    }
}

module.exports.showPendingInvitations = async (req, res, next) => {
    let user = null;
    if (req.headers.type == "User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const pendingInvites = await GroupMember.find({
            confirmed : false,
            user : user._id
        }, 'personInvited personType date group').populate('personInvited', 'username avatar').populate('group', 'description avatar name members coverPhoto')
        return res.status(200).send({"message" : pendingInvites, "success" : true})
    }
    catch (err){
        console.log(err)
        next(err);
    }
}

module.exports.getJoinedGroups = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const groups = await GroupMember.find({
            user : user._id,
            confirmed : true
        },'group isAdmin').populate('group', 'name avatar description members coverPhoto');

        return res.status(200).send({"message" : groups, "success" : true});
    }
    catch (err){
        console.log(err);
        next(err);
    }
}

module.exports.joinGroup = async (req, res, next) => {
    const {groupId} = req.body;
    let user = null;
    if (!groupId){
        return res.status(400).send({"message" : "Invalid information provided!", "success" : false});
    }
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try {   
        const group = await Group.findById(groupId, 'members');
        const newSize = group.members + 1;
        const groupMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
        }, 'confirmed');
        if (groupMember){
            if (groupMember.confirmed)
                return res.status(400).send({"message" : "You are already a member!", "success" : false})
            else
                await GroupMember.updateOne({_id : groupMember._id}, { confirmed: true });
                await Group.updateOne({ _id: ObjectId(groupId)}, {members : newSize});
                return res.status(201).send({"message" : "Group was joined successfully!", "success" : true});
        }
        else{
            let type = req.headers.type;
            const newMember = new GroupMember({
                group : ObjectId(groupId),
                user : ObjectId(user._id.toString()),
                confirmed: true,
                userType : type,
            });
            await newMember.save();
            await Group.updateOne({ _id: ObjectId(groupId)}, {members : newSize});
            return res.status(201).send({"message" : "Group was joined successfully!", "success" : true});
        }
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

module.exports.makeAdmin = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {userId, groupId, userType} = req.body;
    try{
        let userDocument = null;
        if (userType == "User"){
            userDocument = await User.findById(userId, 'username');
        }
        else{
            userDocument = await Animal.findById(userId, 'username');
        }
        if (!userDocument){
            return res.status(404).send({"message" : "Invalid request!", "success" : false});
        }
        const isMember = await GroupMember.findOne({
            user : user._id,
            group : ObjectId(groupId),
        }, 'confirmed isAdmin');
        if (!isMember || !isMember.confirmed || !isMember.isAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        const userIsMember = await GroupMember.findOne({
            user : ObjectId(userId),
            group : ObjectId(groupId),
        }, 'confirmed isAdmin');
        if (!userIsMember || !userIsMember.confirmed){
            return res.status(404).send({"message" : `${userDocument.username} is not a member of this group!`, "success" : false});
        }
        if (userIsMember.isAdmin){
            return res.status(200).send({"message" : `${userDocument.username} is already an Admin!`, "success" : false});
        }
        await GroupMember.updateOne({_id : userIsMember._id}, { isAdmin : true });
        return res.status(201).send({"message" : `${userDocument.username} is now an Admin!`, "success" : true});
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.deleteGroup = async (req, res, next) => {
    const {groupId} = req.body;
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const isMember = await GroupMember.findOne({
            user : ObjectId(user._id.toString()),
            group : ObjectId(groupId),
            confirmed : true
        });
        if (!isMember){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        else{
            if (!isMember.isAdmin){
                return res.status(403).send({"message" : "Only Admins can delete the group!", "success" : false});
            }
        }
        const group = await Group.findById(groupId, '_id');
        if (!group){
            return res.status(400).send({"message" : "Invalid information provided!", "success" : false});
        }
        await Group.deleteOne({_id : ObjectId(groupId)});
        return res.status(200).send({"message" : "Group deleted successfully!", "success" : true});
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

module.exports.getAllGroups = async (req, res, next) => {
    const {counter} = req.body;
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const groups = await Group.find({}, 'name avatar coverPhoto members').sort([['members', -1]]).limit(10).lean();
        for (var i=0;i<groups.length;i++){
            const isMember = await GroupMember.findOne({group : groups[i]._id, user : user._id}, 'confirmed')
            if (!isMember || !isMember.confirmed){
                groups[i]['isMember'] = false;
            }
            else{
                groups[i]['isMember'] = true;
            }
        }
        return res.status(200).send({"message" : groups , "success" : true});
    }
    catch(err){
        console.log(err)
        next(err)
    }
}

module.exports.retrieveGroupFeed = async (req, res, next) => {
    const {groupId, counter} = req.body;
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const posts = await Post.aggregate([
            {
              $match: {
                group: ObjectId(groupId),
              },
            },
            { $sort: { date: -1 } },
            { $skip: Number(counter)*5 },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "Userauthor",
                foreignField: "_id",
                as: "Userauthor",
              },
            },
            {
              $unset: unwantedUserFields,
            },     
            {
              $lookup: {
                from: "animals",
                localField: "Animalauthor",
                foreignField: "_id",
                as: "Animalauthor",
              },
            },
            {
              $unset: unwantedAnimalFields,
            },
            {
              $lookup: {
                from: "postvotes",
                let: { post: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$post", "$$post"],
                      },
                    },
                  },
                  {
                    $group: { _id: null, count: { $sum: 1 } },
                  },
                  {
                    $project: {
                      _id: false,
                    },
                  },
                ],
                as: "votesCount",
              },
            },
            {
              $lookup: {
                from: "comments",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$post", "$$postId"],
                      },
                    },
                  },
                  { $sort: { date: -1 } },
                  { $limit: 3 },
                  {
                    $lookup: {
                      from: "users",
                      localField: "Userauthor",
                      foreignField: "_id",
                      as: "Userauthor",
                    },
                  },
                  {
                    $lookup: {
                      from: "animals",
                      localField: "Animalauthor",
                      foreignField: "_id",
                      as: "Animalauthor",
                    },
                  },
                  {
                    $unset: unwantedAnimalFields,
                  },
                  {
                    $lookup: {
                      from: "commentvotes",
                      localField: "_id",
                      foreignField: "comment",
                      as: "commentVotes",
                    },
                  },
                  {
                    $unwind: {
                      path: "$commentVotes",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $unset: unwantedUserFields,
                  },
                  {
                    $addFields: {
                      commentVotes: "$commentVotes.votes",
                    },
                  },
                ],
                as: "comments",
              },
            },
            {
              $lookup: {
                from: "comments",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$post", "$$postId"],
                      },
                    },
                  },
                  {
                    $group: { _id: null, count: { $sum: 1 } },
                  },
                  {
                    $project: {
                      _id: false,
                    },
                  },
                ],
                as: "commentCount",
              },
            },
            {
              $unwind: {
                path: "$commentCount",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                commentData: {
                  comments: "$comments",
                  commentCount: "$commentCount.count",
                },
              },
            },
            {
              $unset: [...unwantedUserFields, "comments", "commentCount"],
            },
          ]);
          for (var i=0;i<posts.length;i++){
            if (posts[i].authorType == "Animal"){
              const animal_token = jwt.encode({ id: posts[i].Animalauthor[0]._id}, process.env.JWT_SECRET);
              posts[i]['Animalauthor'][0]['category'] = animal_token;
            }
          }
          if (req.headers.type=="User"){
            for (var i=0;i<posts.length;i++){
              const like = await PostVote.findOne({
                  'post' : ObjectId(posts[i]._id.toString()),
                  'voterDetails.Uservoter' : ObjectId(user._id.toString())
              })
              if (like){
                posts[i].isLiked = true;
              }
              else{
                posts[i].isLiked = false;
              }
              const isBookmark = user.bookmarks.some((e) => {
                return e.post == posts[i]._id.toString()
              })
              posts[i].isBookmarked = isBookmark
            }
          }
          if (req.headers.type=="Animal"){
            for (var i=0;i<posts.length;i++){
              const like = await PostVote.findOne({
                  'post' : ObjectId(posts[i]._id.toString()),
                  'voterDetails.Animalvoter' : ObjectId(user._id.toString())
              })
              if (like){
                posts[i].isLiked = true;
              }
              else{
                posts[i].isLiked = false;
              }
              const isBookmark = user.bookmarks.some((e) => {
                return e.post == posts[i]._id.toString()
              })
              posts[i].isBookmarked = isBookmark
            }
          }
          console.log(user.bookmarks)
          return res.status(200).send({posts, "success" : true});
    }
    catch (err) {
        console.log(err);
        next(err)
    }
}

module.exports.getGroupDetails = async (req, res, next) => {
    const {groupId} = req.body;
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const group = await Group.findById(groupId, 'name coverPhoto members description avatar hashtags').lean();
        if (!group){
            return res.status(404).send({"message" : "No such group exists!", "success": false});
        }
        const isMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
            confirmed : true,
        }, 'isAdmin')
        console.log(isMember)
        if (isMember){
            group['isMember'] = true
            if (isMember.isAdmin){
                group['isAdmin'] = true
            }
            else{
                group['isAdmin'] = false
            }
        }
        else{
            group['isMember'] = false;
            group['isAdmin'] = false;
        }
        return res.status(200).send({group});
    }
    catch(err){
        console.log(err)
        next(err)
    }
}

module.exports.getMembers = async (req, res, next) => {
    const {groupId,counter} = req.body;
    try{
        const members = await GroupMember.find({group: groupId, confirmed : true},'user isAdmin userType confirmed').populate('user', 'username name fullName avatar').limit(20).skip(20*counter);
        
        return res.status(200).send({members})
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.removeMember = async (req, res, next) => {
    const {groupId,userId} = req.body;
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const group = await Group.findById(groupId, 'members');
        const isMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
            confirmed : true,
        }, 'isAdmin');
        if (!isMember || !isMember.isAdmin){
            return res.status(403).send({"message" : "Only Group Admins can remove members from the group!", "success" : false});
        }
        const userIsMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(userId),
            confirmed: true
        });
        if (!userIsMember){
            return res.status(404).send({"message" : "User is not a member of this group!"});
        }
        let newSize = group.members - 1;
        await GroupMember.deleteOne({_id : userIsMember._id});
        await Group.updateOne({ _id: groupId}, {members : newSize});
        return res.status(200).send({"message" : 'Member removed successfully!', "success" : true});
    }
    catch(err){
        console.log(err)
        next(err);
    }
}

module.exports.editGroupDetails = async (req, res, next) => {
    const {groupId,name,avatar, description, hashtags} = req.body;
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const isMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
            confirmed : true,
        }, 'isAdmin');
        if (!isMember || !isMember.isAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        await Group.updateOne({ _id: ObjectId(groupId)}, {name, avatar, description, hashtags});
        return res.status(201).send({"message" : 'Details updated successfully!' , "success" : true});
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.editCoverPhoto = async (req, res, next) => {
    const {groupId,name,coverPhoto} = req.body;
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const isMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
            confirmed : true,
        }, 'isAdmin');
        if (!isMember || !isMember.isAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        await Group.updateOne({ _id : ObjectId(groupId)}, {coverPhoto});
        return res.status(201).send({"message" : 'Details updated successfully!' , "success" : true});
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

module.exports.getAdminGroups = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    try{
        const groups = await GroupMember.find({
            user : ObjectId(user._id.toString()),
            isAdmin : true,
        },'group').populate('group','name members avatar description coverPhoto');
        return res.status(200).send({groups});
    }
    catch(err){
        console.log(err)
        next(err);
    }
}

module.exports.removeAdmin = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {groupId,userId} = req.body;
    try{
        const isMember = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(userId),
            confirmed: true
        }, 'isAdmin');
        if (!isMember || !isMember.isAdmin){
            return res.status(404).send({"message" :"Person is not an Admin of this group!", "success":false});
        }
        const userIsAdmin = await GroupMember.findOne({
            group : ObjectId(groupId),
            user : ObjectId(user._id.toString()),
            confirmed : true,
            isAdmin : true
        }, '_id');
        if (!userIsAdmin){
            return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
        await GroupMember.updateOne({_id : isMember._id}, {isAdmin : false});
        return res.status(200).send({"message" : "Removed from Admin position!", "success":true});
    }
    catch(err){
        console.log(err)
        next(err);
    }
}

module.exports.leaveGroup = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {groupId} = req.body;
    try{
        const group = await Group.findById(groupId, 'members');
        const newSize = group.members - 1;
        const isMember = await GroupMember.findOne({
            user : user._id,
            group : ObjectId(groupId),
            confirmed : true
        }, '_id');
        if (!isMember){
            return res.status(403).send({"message" : "You are not a member of this group!", "success" : false});
        }
        await GroupMember.deleteOne({_id : isMember._id})
        if (newSize)
            await Group.updateOne({_id : ObjectId(groupId)}, {members : newSize});
        else
            await Group.deleteOne({ _id: ObjectId(groupId)});
        return res.status(200).send({"message" : "Group left successfully!", "success" : true});
    }
    catch  (err) {

    }
}

module.exports.declineInvitation = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {groupId} = req.body;
    try{
        await GroupMember.deleteOne({
            group : ObjectId(groupId),
            user : user._id,
            confirmed : false,
        });
        return res.status(201).send({"message" : "Invitation declined successfully", "success" : true});
    }
    catch (err){
        console.log(err)
        next(err);
    }
}

// ---------------------------------------- STRAYS ---------------------------------------------

module.exports.getStrays = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {lat, long, counter} = req.body;
    try{
        const animals = await Animal.find({
            category : 'Stray',
            location : {
                $near : {
                    $maxDistance : 100000,
                    $geometry : {
                        type : "Point",
                        coordinates : [long,lat]
                    },
                },
            }
        }, 'name username guardians avatar location').populate('guardians.user', 'fullName avatar username').skip(20*counter).limit(20).lean();
        for (var i=0;i<animals.length;i++){
            animals[i]['distance'] = Math.round(haversineDistance(lat,long,animals[i].location.coordinates[1], animals[i].location.coordinates[0])*10)/10;
        }
        return res.status(200).send({animals})
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

// ---------------------------------------- PLAYBUDDIES ---------------------------------------------

module.exports.getPlayBuddies = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {lat, long, counter} = req.body;
    try{
        const animals = await Animal.find({
            playBuddies : true,
            location : {
                $near : {
                    $maxDistance : 100000,
                    $geometry : {
                        type : "Point",
                        coordinates : [long,lat]
                    },
                },
            }
        }, 'name username guardians avatar location').populate('guardians.user', 'fullName avatar username').skip(20*counter).limit(20).lean();
        for (var i=0;i<animals.length;i++){
            animals[i]['distance'] = Math.round(haversineDistance(lat,long,animals[i].location.coordinates[1], animals[i].location.coordinates[0])*10)/10;
        }
        return res.status(200).send({animals})
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

// ---------------------------------------- ADOPTION ---------------------------------------------

module.exports.getAdoption = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {lat, long, counter} = req.body;
    try{
        const animals = await Animal.find({
            adoption : true,
            location : {
                $near : {
                    $maxDistance : 100000,
                    $geometry : {
                        type : "Point",
                        coordinates : [long,lat]
                    },
                },
            }
        }, 'name username guardians avatar location').populate('guardians.user', 'fullName avatar username').skip(20*counter).limit(20).lean();
        for (var i=0;i<animals.length;i++){
            animals[i]['distance'] = Math.round(haversineDistance(lat,long,animals[i].location.coordinates[1], animals[i].location.coordinates[0])*10)/10;
        }
        return res.status(200).send({animals});
    }
    catch (err){
        console.log(err)
        next(err);
    }
}

// ---------------------------------------- MATING ---------------------------------------------
module.exports.getMating = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {lat,long,counter} = req.body;
    try {
        const animals = await Animal.find({
            mating : true,
            location : {
                $near : {
                    $maxDistance : 100000,
                    $geometry : {
                        type : "Point",
                        coordinates : [long,lat]
                    },
                },
            }
        }, 'name username guardians avatar location').populate('guardians.user', 'fullName avatar username').skip(20*counter).limit(20).lean();
        for (var i=0;i<animals.length;i++){
            animals[i]['distance'] = Math.round(haversineDistance(lat,long,animals[i].location.coordinates[1], animals[i].location.coordinates[0])*10)/10;
        }
        return res.status(200).send({animals});
    }
    catch (err) {
        console.log(err)
        next(err);
    }
}