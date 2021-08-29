const Sauce = require('../models/Sauce');
const fs = require('fs');
const { json } = require('express');

// Renvoi un tableau regroupant toute les sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
}

// Renvoi la sauce correspondant a l'id envoyé
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
}

// Créé une sauce et l'ajouter a la base de donnée
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })
    sauce.save()
        .then(() => res.status(201).json({ message: 'Nouvelle sauce créé !' }))
        .catch(error => res.status(400).json({ error }))
}


// Met a jour une sauce existante
exports.updateSauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

    if (req.file) {
        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err => {
                    if (err) console.log(err);
                    else {
                        console.log("\nDeleted file");
                    }
                }));
            })
            .catch(error => res.status(400).json({ error }))
    }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifié !' }))
        .catch(error => res.status(400).json({ error }));
}


// Supprime la sauce qui possède l'id envoyé
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => next())
                    .catch(error => res.status(400).json({ error }));
            })
            res.status(200).json({ message: 'Sauce supprimé'});
        })
        .catch(error => res.status(400).json({ error }))
}

// Met à jour les likes et dislikes de la sauce désiré
exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        switch (req.body.like) {
            // Ajout d'un like
            case 1:
                // Vérification que la sauce ne soit pas déjà liké par l'utilisateur
                sauce.usersLiked.forEach(user => {
                    if(user == req.body.userId){
                        res.status(200).json({message: 'Sauce déjà liké'});
                    };
                });

                // Vérification que la sauce ne soit pas disliké par l'utilisateur et ajout du like
                sauce.usersDisliked.forEach(function(user, index, object){
                    if(user == req.body.userId){
                        sauce.likes++;
                        sauce.dislikes--;
                        sauce.usersLiked.push(req.body.userId);
                        sauce.usersDisliked.splice(index, 1);
                        sauce.save()
                        .then(() => res.status(200).json({message: 'Ajout du like + Suppression du dislike'}))
                        .catch(error => res.status(400).json({ error }))
                    };
                });

                // Ajout du like
                sauce.likes++;
                sauce.usersLiked.push(req.body.userId);
                sauce.save()
                .then(() => res.status(200).json({message: 'Ajout du like'}))
                .catch(error => res.status(400).json({ error }))

                break;
            // Remise à 0 des likes et dislikes
            case 0:
                // Suppression du like si la sauce a été liké
                sauce.usersLiked.forEach(function(user, index, object){
                    if(user == req.body.userId){
                        sauce.likes--;
                        sauce.usersLiked.splice(index, 1);
                        sauce.save()
                        .then(() => res.status(200).json({message: 'Suppression du like'}))
                        .catch(error => res.status(400).json({ error }))
                    };
                });

                // Suppression du dislike si la sauce a été disliké
                sauce.usersDisliked.forEach(function(user, index, object){
                    if(user == req.body.userId){
                        sauce.dislikes--;
                        sauce.usersDisliked.splice(index, 1);
                        sauce.save()
                        .then(() => res.status(200).json({message: 'Suppression du dislike'}))
                        .catch(error => res.status(400).json({ error }))
                    };
                });

                res.status(200).json({message: 'Initialisation'});
                break;
            //Ajout d'un dislike
            case -1:
                // Vérification que la sauce ne soit pas liké par l'utilisateur et ajout du dislike
                sauce.usersLiked.forEach(function(user, index, object){
                    if(user == req.body.userId){
                        sauce.likes--;
                        sauce.dislikes++;
                        sauce.usersDisliked.push(req.body.userId);
                        sauce.usersLiked.splice(index, 1);
                        sauce.save()
                        .then(() => res.status(200).json({message: 'Ajout du dislike + Suppression du like'}))
                        .catch(error => res.status(400).json({ error }))
                    };
                });

                // Vérification que la sauce ne soit pas déjà disliké par l'utilisateur
                sauce.usersDisliked.forEach(user => {
                    if(user == req.body.userId){
                        res.status(200).json({message: 'Sauce déjà disliké'});
                    };
                });

                // Ajout du dislike
                sauce.dislikes++;
                sauce.usersDisliked.push(req.body.userId);
                sauce.save()
                .then(() => res.status(200).json({message: 'Ajout du dislike'}))
                .catch(error => res.status(400).json({ error }))
                break;
        }
    })
    .catch(error => res.status(400).json({ error }))
}













