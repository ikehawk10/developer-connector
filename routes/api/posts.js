const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// POST model
const Post = require('../../models/Post');
// Profile model
const Profile = require('../../models/Profile');

// Validations
const validatePostInput = require('../../validation/post');

// @route 			GET api/posts/test
// @description Tests posts route
// @access 			public
router.get('/test', (req, res) => res.json({ msg: 'posts works' }));

// @route 			GET api/posts
// @description Get posts
// @access 			public
router.get('/', (req, res) => {
	Post.find()
		.sort({ date: -1 })
		.then(posts => res.json(posts))
		.catch(err => res.status(404).json({ nopostsfound: 'no posts found' }));
});

// @route 			GET api/posts/:id
// @description Get single post
// @access 			public
router.get('/:id', (req, res) => {
	Post.findById(req.params.id)
		.then(post => res.json(post))
		.catch(err =>
			res.status(404).json({ nopostfound: 'no post found with that ID' })
		);
});

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

// @route 			DELETE api/posts/:id
// @description Delete posts
// @access 			private

router.delete(
	'/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id }).then(profile => {
			Post.findById(req.params.id).then(post => {
				if (post.user.toString() !== req.user.id) {
					return res.status(401).json({ notauthorized: 'User not authorized' });
				}

				Post.remove()
					.then(() => {
						res.json({ success: true });
					})
					.catch(err =>
						res.status(404).json({ postnotfound: 'No posts found' })
					);
			});
		});
	}
);

// @route 			POST api/posts/like/:id
// @description Like posts
// @access 			private

router.post(
	'/like/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id }).then(profile => {
			Post.findById(req.params.id)
				.then(post => {
					if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
						return res.status(400).json({ alreadyliked: 'User already liked this post'})
					}

					//Add user ID to likes array
					post.likes.unshift({ user: req.user.id });

					post.save().then(post => res.json(post));
			});
		});
	}
);

// @route 			POST api/posts/unlike/:id
// @description unlike posts
// @access 			private

router.post(
	'/unlike/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id }).then(profile => {
			Post.findById(req.params.id)
				.then(post => {
					if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
						return res.status(400).json({ notliked: 'You have not liked this post'})
					}

					//Remove user ID from likes array
					const removeIndex = post.likes
						.map(item => item.user.toString())
						.indexOf(req.user.id);

						post.likes.splice(removeIndex, 1);


					post.save().then(post => res.json(post));
			});
		});
	}
);

module.exports = router;
