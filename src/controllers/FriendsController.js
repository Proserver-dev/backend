const { Sequelize, Op } = require('sequelize');
const User = require('../models/UserModel');
const Friend = require('../models/FriendModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const API_RESULTS = require('../constants/apiResults');

const addFriend = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']

    #swagger.responses[404] = { 
        description: "User nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS']
        }  
    }

    #swagger.responses[409] = {
        description: 'Nie możesz wysłać zaproszenia do siebie',
        schema: { error: 'ERR_CANNOT_SEND_INVITATION_TO_YOURSELF' }
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            {
                success: 'SUCCESS_SEND_INVITATION_TO_FRIEND',
                friend: { $ref: '#/definitions/Friend' }
            }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const sourceUserId = req.user.id;
        const targetUserId = req.params.userId;

        if(sourceUserId == targetUserId) {
            return res.status(API_RESULTS.ERR_CANNOT_SEND_INVITATION_TO_YOURSELF.status_code).json({ error: API_RESULTS.ERR_CANNOT_SEND_INVITATION_TO_YOURSELF.code });
        }

        const sourceUser = await User.findByPk(sourceUserId);
        const targetUser = await User.findByPk(targetUserId);

        if (!sourceUser || !targetUser) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        const existFriend = await Friend.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { [Sequelize.Op.and]: [ { sourceUserId: sourceUser.id }, { targetUserId: targetUser.id } ] },
                    { [Sequelize.Op.and]: [ { sourceUserId: targetUser.id }, { targetUserId: sourceUser.id } ] }
                ],
            }
        });

        if(existFriend) {
            return res.status(API_RESULTS.ERR_YOU_ARE_ALREADY_FRIENDS.status_code).json({ error: API_RESULTS.ERR_YOU_ARE_ALREADY_FRIENDS.code });
        }

        const friend = await Friend.create({ sourceUserId, targetUserId });

        res.status(API_RESULTS.SUCCESS_SEND_INVITATION_TO_FRIEND.status_code).json({ success: API_RESULTS.SUCCESS_SEND_INVITATION_TO_FRIEND.code, friend: friend });
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const acceptFriend = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']

    #swagger.responses[404] = { 
        description: "User nie istnieje, taka znajomość nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_FRIEND_INVITATION_NOT_EXISTS']
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            {
                success: 'SUCCESS_ACCEPT_INVITATION_TO_FRIEND',
                friend: { $ref: '#/definitions/Friend' }
            }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const myId = req.user.id;
        const userId = req.params.userId;

        const friend = await Friend.findOne({
            where: {
                sourceUserId: userId,
                targetUserId: myId,
                isAccepted: false
            }
        });

        if (!friend) {
            return res.status(API_RESULTS.ERR_FRIEND_INVITATION_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_FRIEND_INVITATION_NOT_EXISTS.code });
        }

        friend.isAccepted = true;
        friend.acceptedAt = new Date();
        await friend.save();

        res.status(API_RESULTS.SUCCESS_ACCEPT_INVITATION_TO_FRIEND.status_code).json({ success: 'SUCCESS_ACCEPT_INVITATION_TO_FRIEND', friend: friend });
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const deleteFriend = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']
    #swagger.summary = 'Usuwa znajomość z użytkownikiem, ewentualnie cofa lub odrzuci zaproszenie'

    #swagger.responses[404] = { 
        description: "User nie istnieje, taka znajomość nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_FRIEND_INVITATION_NOT_EXISTS']
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            {
                success: 'SUCCESS_DELETED_FRIEND',
                friend: { $ref: '#/definitions/Friend' }
            }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const myId = req.user.id;
        const userId = req.params.userId;

        const friend = await Friend.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { [Sequelize.Op.and]: [ { sourceUserId: myId }, { targetUserId: userId } ] },
                    { [Sequelize.Op.and]: [ { sourceUserId: userId }, { targetUserId: myId } ] }
                ]
            }
        });

        if (!friend) {
            return res.status(API_RESULTS.ERR_FRIEND_INVITATION_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_FRIEND_INVITATION_NOT_EXISTS.code });
        }

        await friend.destroy();

        res.status(API_RESULTS.SUCCESS_DELETED_FRIEND.status_code).json({ success: 'SUCCESS_DELETED_FRIEND', friend: friend });
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const getMyFriends = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']
    #swagger.summary = 'Zwraca listę znajomych użytkownika z tokena (aktualnie zalogowanego)'

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            { $ref: '#/definitions/User' }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const userId = req.user.id;

        const friends = await Friend.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { sourceUserId: userId },
                    { targetUserId: userId }
                ],
                isAccepted: true
            }
        });

        const friendIds = friends.map(friend => friend.sourceUserId === userId ? friend.targetUserId : friend.sourceUserId);

        const users = await User.findAll({
            where: {
                id: { [Sequelize.Op.in]: friendIds }
            }
        });

        const usersPromises = users.map(async user => await user.getFullData())
        const result = await Promise.all(usersPromises);

        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const getFriendsForUserId = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']
    #swagger.summary = 'Zwraca listę znajomych konkretnego użytkownika o userId'

    #swagger.responses[404] = { 
        description: "User nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS']
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            { $ref: '#/definitions/User' }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const userId = req.params.userId;

        if(!userId) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        const user = await User.findByPk(userId)

        if(!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        const friends = await Friend.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { sourceUserId: userId },
                    { targetUserId: userId }
                ],
                isAccepted: true
            }
        });

        const friendIds = friends.map(friend => friend.sourceUserId === userId ? friend.targetUserId : friend.sourceUserId);

        const users = await User.findAll({
            where: {
                id: { [Sequelize.Op.in]: friendIds }
            }
        });

        const usersPromises = users.map(async user => await user.getFullData())
        const result = await Promise.all(usersPromises);

        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const getSentInvitations = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']
    #swagger.summary = 'Zwraca listę wysłanych zaproszeń do znajomych (oczekujących na akceptację przez drugą stronę)'

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            {
                id: 1,
                isActivated: true,
                sourceUserId: 1,
                targetUserId: 2,
                isAccepted: false,
                updatedAt: "2023-11-15T04:17:54.000Z",
                createdAt: "2023-11-07T20:16:13.000Z",
                targetUser: { $ref: '#/definitions/User' }
            }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const userId = req.user.id;

        const sentInvitations = await Friend.findAll({
            where: {
                sourceUserId: userId,
                isAccepted: false 
            }
        });

        const modifiedInvitationsPromises = sentInvitations.map(async (invitation) => {
            const modifiedInvitation = invitation.toJSON();
            const user = await User.findByPk(modifiedInvitation.targetUserId)
            modifiedInvitation.targetUser = await user.getFullData()
            return modifiedInvitation;
        });

        const modifiedInvitations = await Promise.all(modifiedInvitationsPromises);

        res.json(modifiedInvitations);
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const getWaitingForAcceptInvitations = async (req, res) => {
    /* 
    #swagger.tags = ['Friends']
    #swagger.summary = 'Zwraca listę zaproszeń oczekujących na akceptację'

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [
            {
                id: 1,
                isActivated: true,
                sourceUserId: 2,
                targetUserId: 1,
                isAccepted: false,
                updatedAt: "2023-11-15T04:17:54.000Z",
                createdAt: "2023-11-07T20:16:13.000Z",
                sourceUser: { $ref: '#/definitions/User' }
            }
        ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    saveLogFromEndpointRequest(req);

    try {
        const userId = req.user.id;

        const waitingInvitations = await Friend.findAll({
            where: {
                targetUserId: userId,
                isAccepted: false 
            }
        });

        const modifiedInvitationsPromises = waitingInvitations.map(async (invitation) => {
            const modifiedInvitation = invitation.toJSON();
            const user = await User.findByPk(modifiedInvitation.sourceUserId)
            modifiedInvitation.sourceUser = await user.getFullData()
            return modifiedInvitation;
        });

        const modifiedInvitations = await Promise.all(modifiedInvitationsPromises);

        res.json(modifiedInvitations);
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { addFriend, acceptFriend, deleteFriend, getMyFriends, getFriendsForUserId, getSentInvitations, getWaitingForAcceptInvitations }
