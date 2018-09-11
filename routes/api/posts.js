const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../../models/Post');

// Validations
const validatePostInput = require('../../validation/post');

// @route 			GET api/posts/test
// @description Tests posts route
// @access 			public
router.get('/test', (req, res) => res.json({ msg: 'posts works' }));

// @route 			POST api/posts
// @description Create posts
// @access 			private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const { errors, isValid } = validatePostInput(req.body);

		if (!isValid) {
			return res.status(400).json(errors);
		}
		const { text, name, avatar } = req.body;
		const newPost = new Post({
			text,
			name,
			avatar,
			user: req.user.id
		});

		newPost.save().then(post => res.json(post));
	}
);

module.exports = router;
