const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

//load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

const User = require('../../models/User');

// @route 			GET api/users/test
// @description Tests users route
// @access 			public
router.get('/test', (req, res) => res.json({ msg: 'users works' }));

// @route 			GET api/users/register
// @description Register a user
// @access 			public
router.post('/register', (req, res) => {
	const { errors, isValid } = validateRegisterInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	User.findOne({ email: req.body.email }).then(user => {
		if (user) {
			errors.email = 'Email already exists';
			return res.status(400).json(errors);
		} else {
			const avatar = gravatar.url(req.body.email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});
			const newUser = new User({
				name: req.body.name,
				email: req.body.email,
				avatar,
				password: req.body.password
			});

			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if (err) throw err;
					newUser.password = hash;
					newUser.save().then(user => {
						res.json(user).catch(err => console.log(err));
					});
				});
			});
		}
	});
});

// @route 			POST api/users/login
// @description Login a user / returning json web token
// @access 			public
router.post('/login', (req, res) => {
	const { errors, isValid } = validateLoginInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	const { email, password } = req.body;

	User.findOne({ email }).then(user => {
		if (!user) {
			errors.email = "User not found"
			return res.status(404).json(errors);
		}

		bcrypt.compare(password, user.password).then(isMatch => {
			if (isMatch) {
				//login match
				const { id, name, avatar } = user;
				//create JWT payloard
				const payload = { id, name, avatar };
				//sign token
				jwt.sign(
					payload,
					keys.secretOrKey,
					{ expiresIn: 3600 },
					(err, token) => {
						res.json({ success: true, token: `Bearer ${token}` });
					}
				);
			} else {
				errors.password = 'Password is incorrect'
				return res.status(400).json(errors);
			}
		});
	});
});

// @route 			GET api/users/current
// @description Return the current user
// @access 			private
router.get(
	'/current',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		res.json(req.user);
	}
);

module.exports = router;
