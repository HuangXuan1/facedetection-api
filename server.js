const express = require('express');
/*decode what contains in the body*/
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
/*secruity*/
const cors = require('cors');
const knex = require('knex');

/*link the database*/
const postgres = knex({
	client: 'pg',
	  connection: {
	    host : '127.0.0.1',
	    user : 'postgres',
	    password : 'adg2144556',
	    database : 'facedetectionDB'
	  }
});

/*postgres.select('*').from('users').then(data => {
	console.log(data);
});*/

const app = express();
app.use(bodyParser.json());
app.use(cors());

/*fake user, to test the functionality of the server*/
/*const database = {
	users: [
	 {
	 	id: '1',
	 	name: 'John1',
	 	email: 'john1@gmail.com',
	 	password: 'password1',
	 	entries: 0,
	 	joined: new Date()
	  },
	  {
	 	id: '2',
	 	name: 'John2',
	 	email: 'john2@gmail.com',
	 	password: 'password2',
	 	entries: 0,
	 	joined: new Date()
	  },
	  {
	 	id: '3',
	 	name: 'John3',
	 	email: 'john3@gmail.com',
	 	password: 'password3',
	 	entries: 0,
	 	joined: new Date()
	  },
	],
	login: [
      {
      	id: '987',
      	hash:'',
      	email: 'john1@gmail.com'
      }
	]
}*/

/*res means what server will response to the front-end(to the user side)*/
app.get('/', (req, res) => {
	postgres.select('*').from('users')
	.then(user => res.json(user[0]))
	.catch(err => res.status(400).json('unable to find the user'))
})

app.post('/signin', (req, res) => {
	/*bcrypt.compare("password4", '$2a$10$1NcDnGm35VtrZg4ur77Wt.4a7Sy2HHQuqy8dldRIkVV2UOMLBOKxK', function(err, res) {
      console.log('first', res)
    });
    bcrypt.compare("veggies", '$2a$10$1NcDnGm35VtrZg4ur77Wt.4a7Sy2HHQuqy8dldRIkVV2UOMLBOKxK', function(err, res) {
      console.log('second', res)
    });*/
	postgres.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if (isValid) {
			return postgres.select('*').from('users').where('email', '=', req.body.email)
			.then(user => res.json(user[0]))
			.catch(err => res.status(400).json('unable to find the user'))
		} else {
			res.status(400).json('Wrong password')
		}
		
	})
	.catch(err => res.status(400).json('does not exist'))
})

app.post('/register', (req, res) => {
	const {email, name, password} = req.body;
	if (!email || !name || !password) {
		return res.status(400);
	}
	const hash = bcrypt.hashSync(password);
		postgres.transaction(trx => {
			trx.insert({
				hash:hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
				return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user => {
					res.json(user[0]);
			  })
		   })
			.then(trx.commit)
			.catch(trx.rollback)
		})
		.catch(err => res.status(400).json('This email used'))
	/*bcrypt.hash(password, null, null, function(err, hash) {
    // Store hash in your password DB.
    console.log(hash);
	});*/
/*	database.users.push({
	 	id: '4',
	 	name: name,
	 	email: email,
	 	/*password: password,
	 	entries: 0,
	 	joined: new Date()
	})*/

})

app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	postgres.select('*').from ('users').where({id})
	/*user is an array*/
	.then(user => {
		if (user.length > 0) {
		  res.json(user[0])
		} else {
		   res.status(400).json('Not Found')
		}
	})
	.catch(err => res.status(400).json('Error'))
/*	database.users.forEach(user => {
		if (user.id === id) {
			return res.json(user);
		}
	})*/
	/*res.json('not found');*/
})


app.put('/image', (req, res) => {
	const {id} = req.body;
	/*database.users.forEach(user => {
		if (user.id === id) {
			return res.json(++user.entries);
		}
	})
	res.statue(400).json('not found');*/
	postgres('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('error'))
})



// Load hash from your password DB.
/*bcrypt.compare("password4", '$2a$10$1NcDnGm35VtrZg4ur77Wt.4a7Sy2HHQuqy8dldRIkVV2UOMLBOKxK', function(err, res) {
    // res == true
});
bcrypt.compare("veggies", '$2a$10$1NcDnGm35VtrZg4ur77Wt.4a7Sy2HHQuqy8dldRIkVV2UOMLBOKxK', function(err, res) {
    // res = false
});
*/
app.listen(process.env.PORT || 3000, () => {
	console.log('RUN!!!!');
})

/*
work flow
/--> res = this is working
/signin --> POST(we want to contains keyword in the body rather in the url)  = success/fail
/signup --> post = new user
/profile/: userId --> GET = user inf
/image --> PUT(update) --> user inf

*/