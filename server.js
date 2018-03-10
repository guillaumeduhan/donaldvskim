/* Serveur maj: 10/03/2018 à 17:56:13 */

const express = require('express');
const path = require('path');
const http = require('http');
const MongoClient = require('mongodb').MongoClient;

const monServeur = express();
const monServeurIo = require('http').createServer(monServeur);
const socketIO = require('socket.io')(monServeurIo);

const port = 5000;
const url = 'mongodb+srv://guillaume:86327417Gd%2E@donaldvskim-zqkaf.mongodb.net'
// const url = 'mongodb://localhost:27017'
const dbName = 'users'

/*
  SSH Mongo: mongo "mongodb+srv://donaldvskim-zqkaf.mongodb.net/test" --username guillaume

  /Applications/mongodb/bin/mongod --config=/Users/guillaume/Desktop/Guillaume/Game/mongod.conf &
/Applications/mongodb/bin/mongo
*/

monServeur.use('/css', express.static(__dirname + '/assets/css'))
monServeur.use('/js', express.static(__dirname + '/assets/js'))
monServeur.use('/images', express.static(__dirname + '/static/medias'))

monServeur.get('/', function(req, res, next) {
  res.sendFile('index.html', {
    root: path.join(__dirname, './static')
  });
})

// Partie Jeu

var data = {
  barreDeVie: {
    mw: 200 + 'px',
    h: 15 + 'px',
    mg: 25 + 'px',
    o: 'hidden',
    p: 'fixed',
    tr: '.25s'
  },
  barreDeScoreDuPerso: {
    w: 200 + 'px',
    h: 30 + 'px',
    t: 25 + 'px',
    fs: 18 + "px"
  },
  barreDeScoreGeneral: {
    w: 300 + 'px',
    h: 200 + 'px',
    r: 20 + 'px',
    br: 'none'
  },
  barreDePseudo: {
    w: 200 + 'px',
    h: 50 + 'px',
    p: 'relative',
    ta: 'center',
    fs: 12 + 'px'
  },
  cadre: {
    x: 0 + 'px',
    y: 0 + 'px',
    h: 250 + 'px',
    w: 125 + 'px',
    l: 125 + 'px',
    o: 'hidden',
    txy: 'translate(-50%, -50%)'
  },
  coeur: {
    src: '/images/hearts.png',
    x: 0 + 'px',
    y: 0 + 'px',
    h: 50 + 'px',
    w: 50 + 'px',
    o: 'hidden',
    t: 0 + 'px',
    l: 0 + 'px',
    p: 'absolute',
    br: 50 + 'px',
    pa: 10 + 'px'
  },
  couleurs: {
    y: '#f7d411',
    r: 'tomato',
    ro: 'deeppink',
    lm: 'limegreen',
    dr: 'red',
    w: 'white'
  }
}

/*
  Fonctions primaires
  */

// Générer un id
const idGenerator = function() {
  function idPart() {
    return (((1 + Math.random()) * 0x1000000) | 0).toString(16).substring(1);
  }
  return idPart() + idPart() + idPart() + idPart();
}

// Générér une couleur
const randomColor = function() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const Joueur = function(nom, kim, idImage) {
  // this.choice = Renvoyer le valeur kim ou trump depuis le formulaire
  this.name = nom;
  this.kim = kim;
  this.x = data.cadre.x;
  this.y = data.cadre.y;
  this.id = idGenerator();
  this.idImage = idImage;
  this.width = data.cadre.w;
  this.height = data.cadre.h;
  this.color = randomColor();
  this.overflow = data.cadre.o;
  this.updatePosition = function(clientX, clientY) {
    this.x = clientX;
    this.y = clientY;
  };
  this.getClientObject = function() {
    return {
      name: this.name,
      kim: this.kim,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      o: this.overflow,
      id: this.id,
      idImage: this.idImage,
      color: this.color
    }
  }
};

// Créer la barre de pseudo du joueur
const InterfaceBarrePseudo = function() {
  this.color = randomColor();
}

// Créer l'interface joueur
const InterfaceJoueur = function() {
  this.height = data.barreDeVie.h;
  this.width = data.barreDeVie.mw;
  this.margin = data.barreDeVie.mg;
  this.overflow = data.barreDeVie.o;
  this.position = data.barreDeVie.p;
  this.transition = data.barreDeVie.tr;
  this.backgroundColor = data.couleurs.lm;
}

// Créer l'interface de score du joueur
const InterfaceScoreJoueur = function() {
  this.height = data.barreDeScoreDuPerso.h;
  this.width = data.barreDeScoreDuPerso.w;
  this.top = data.barreDeScoreDuPerso.t;
  this.margin = data.barreDeVie.mg;
  this.position = data.barreDeVie.p;
  this.transition = data.barreDeVie.tr;
  this.color = data.couleurs.y;
  this.fontSize = data.barreDeScoreDuPerso.fs;
}

// Créer l'interface de score générale
const ScoreGeneral = function() {
  this.height = data.barreDeScoreGeneral.h;
  this.width = data.barreDeScoreGeneral.w;
  this.right = data.barreDeScoreGeneral.r;
  this.border = data.barreDeScoreGeneral.br;
  this.margin = data.barreDeVie.mg;
  this.overflow = data.barreDeVie.o;
  this.position = data.barreDeVie.p;
  this.transition = data.barreDeVie.tr;
}

// Globes de vies
const UsineCoeurs = function(a, b) {
  this.top = a,
  this.left = b,
  this.id = idGenerator();
  this.src = data.coeur.src,
  this.width = data.coeur.w;
  this.height = data.coeur.h;
  this.position = data.coeur.p;
  this.backgroundColor = data.couleurs.lm;
  this.borderRadius = data.coeur.br;
  this.padding = data.coeur.pa;
  this.getClientObject = function() {
    return {
      t: this.top,
      l: this.left,
      id: this.id,
      src: this.src,
      w: this.width,
      h: this.height,
      p: this.position,
      bg: this.backgroundColor,
      br: this.borderRadius,
      pa: this.padding
    }
  }
}

// Connect to mongodb
MongoClient.connect(url, function(err, client) {

  if (err) {
    throw err
  } else {
    console.log('Connexion à MongoDB réussie: ' + url);
  }

  let db = client.db('users'); // Indispensable
  let liste = db.collection('liste');
  let scores = db.collection('scores');

  const listeDesJoueurs = {};
  let size = Object.keys(listeDesJoueurs).length;

  socketIO.on('connection', function(socket) {

    function globesDeVie() {
      const packageVie = new UsineCoeurs(Math.floor(Math.random() * 800) + 20 + 'px', Math.floor(Math.random() * 1000) + 20 + 'px');
      socket.emit('creerUnGlobe', packageVie);
      socket.broadcast.emit('unNouveauGlobeApparait', packageVie);
    };

    // Transformer en array l'objet des joueurs en ligne retournés
    listeDesJoueursArray = Object.keys(listeDesJoueurs).map(key => listeDesJoueurs[key]);

    // J'envoie la liste de tous les joueurs
    socket.emit('allJoueurs', listeDesJoueursArray);

    // Création d'un joueur
    socket.on('jenvoieMonNom', function(newplayer) {

      // Checke si le nom existe déjà
      liste.find({"nom": newplayer.nom}).toArray(function(err, data) {
        // S'il existe déjà, j'empêche d'entrer
        if (data.length > 0) {
          socket.emit('pseudoDejaPris', data)
          console.log('Pseudo déjà pris');
        } else {
          // Sinon, je lance le bordel
          // Je me connecte à la bdd et j'insère le nouveau joueur dans la liste s'il n'existe pas
          liste.insertOne({nom: newplayer.nom, kim: newplayer.kim, sid: socket.id});
          // J'ajoute le joueur à la liste des scores
          scores.insertOne({nom: newplayer.nom, score: newplayer.score, sid: socket.id});
          // Je déclenche les globe de survie
          setInterval(globesDeVie, 5000);

          // Je crée un nouveau joueur de l'autre côté avec les données envoyées (dont mon nom)
          const nom = newplayer.nom;
          const kim = newplayer.kim;
          const idImage = socket.id;
          const myJoueur = new Joueur(nom, kim, idImage); // J'envoie son nom/type dans la fonction
          listeDesJoueurs[socket.id] = myJoueur;
          const clientObject = myJoueur.getClientObject();

          socket.emit('myJoueurCreated', clientObject); // Crée mon joueur
          socket.broadcast.emit('ajoutDunNouveauJoueur', clientObject); // Notification de ma création
          socket.emit('jeRecupLaListeDesJoueurs', listeDesJoueurs) // Je récupère les anciens joueurs

          const barre = new InterfaceJoueur();
          socket.emit('creerLaBarreDeVie', barre);

          const barreScore = new InterfaceScoreJoueur();
          socket.emit('creerLaBarreDeScore', barreScore);

          const barreScoreGeneral = new ScoreGeneral();
          socket.emit('creerLaBarreDeScoreGeneral', barreScoreGeneral);

          // Je récupère la liste des scores
          scores.find().limit(10).sort({score: -1}).toArray(function(err, resultats) {
            if (err) {
              throw err;
            } else {
              // Envoyer les scores
              socket.emit('creeLeTableau', resultats)
              // socket.broadcast.emit('creeLeTableau', resultats)
            }
          })
        }
      })
    })

    // MAJ de la position des joueurs
    socket.on('moveJoueur', function(coords) {
      if (listeDesJoueurs[socket.id]) {
        const myJoueur = listeDesJoueurs[socket.id];
        myJoueur.x = coords.x;
        myJoueur.y = coords.y;

        // MAJ de la position
        const clientObject = myJoueur.getClientObject();
        socketIO.emit('updateJoueurPosition', clientObject);
      }
    });

    // Si un joueur meurt, je vais chercher son socket.id et je le renvoie
    socket.on('mortDunJoueur', function() {
      console.log("Dead:" + socket.id);
      var monIdPutain = socket.id;
      socket.emit('jeVeuxMonID', monIdPutain)
      socket.broadcast.emit('jeVeuxMonID', monIdPutain)
    })

    // Déconnexion d'un joueur
    socket.on('disconnect', (reason) => {
      // Supprime de la liste BDD le joueur
      liste.deleteOne({sid: socket.id})
      // S'il n'y a plus personne de connecté sur socket local, supprime la liste DB
      if (size < 1) {
        liste.drop();
        console.log("Erreurs supprimées");
      }

      console.log('Déconnexion :', socket.id, reason);
      if (listeDesJoueurs[socket.id] && listeDesJoueurs[socket.id].id) {
        // Je le supprime du tableau
        const joueurId = listeDesJoueurs[socket.id].id;
        delete listeDesJoueurs[socket.id];
        // Je le supprime de la bdd
        socketIO.emit('removeJoueur', joueurId);
      }
    });

    // Globe disparaît quand quelqu'un a cliqué dessus
    socket.on('globeEnglouti', function(data) {
      socket.emit('globeDisparait', data)
      socket.broadcast.emit('globeDisparait', data)
    })

    // Augmente le score dans la base de données (grâce au socketId)
    socket.on('scoreAugmente', function(data) {

      // Je reçois le nouveau score, je cherche son socket.id et je l'enregistre
      scores.updateOne({
        sid: socket.id
      }, {
        $set: {
          score: data.score
        }
      }, {
        upsert: true // rechercher et rajouter
      });

      // Je renvoie le nouveau tableau
      setTimeout(function() {
        scores.find().limit(8).sort({score: -1}).toArray(function(err, resultats) {
          if (err) {
            throw err;
          } else {
            // Envoyer les scores
            socket.emit('majTableau', resultats)
            socket.broadcast.emit('majTableau', resultats)
          }
        })
      }, 2000)

    });

  }); // Fin du socket connect

  monServeurIo.listen(port, function() {
    console.log('Listen on ' + port);
  });

}) // Fin du MongoClient