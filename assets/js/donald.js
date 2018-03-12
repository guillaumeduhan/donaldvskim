(function(window, io) {

  'use strict';

  window.addEventListener('DOMContentLoaded', function() {

    let socketIo = io();
    // let socketIo = io('http://localhost:3000');

    let data = {
      startButton: window.document.getElementById('play'),
      startScreen: window.document.getElementById('chargement'),
      beforeButton: window.document.getElementById('enter-game'),
      beforeScreen: window.document.getElementById('selection'),
      trump: window.document.getElementById('stormy'),
      kimkardashian: window.document.getElementById('kimmy'),
      joueurActuel: {
        couleur: '',
        life: 200,
        score: 0
      },
      couleurs: {
        y: '#f7d411',
        r: 'tomato',
        ro: 'deeppink',
        lm: 'limegreen',
        dr: 'red',
        w: 'white'
      },
      kim: false,
      gameOver: false
    }

    let start = function() {

      // Créer un joueur
      var creerUnJoueur = function(joueur) {
        var div = window.document.createElement('div');
        div.id = joueur.id;
        div.style.top = joueur.x + 'px';
        div.style.left = joueur.y + 'px';
        div.style.width = joueur.width;
        div.style.height = '270px'; // joueur.height
        div.style.paddingTop = '20px'; // joueur.height
        div.style.position = 'absolute';
        div.style.overflow = 'hidden';
        window.document.body.appendChild(div);

        var nouveauPlayer = document.createElement('img')
        nouveauPlayer.id = joueur.idImage;
        nouveauPlayer.className = 'storm';
        if (joueur.kim == false) {
          nouveauPlayer.src = '/images/trump.png';
        } else {
          nouveauPlayer.src = '/images/kim2.png';
        }
        div.appendChild(nouveauPlayer);
        // Envoyer au serveur si Kim est true ou pas

        var barre = window.document.createElement('div');
        var name = document.createTextNode(joueur.name);
        barre.appendChild(name);
        barre.style.width = joueur.width;
        barre.style.height = 10 + 'px';
        barre.style.top = '0px';
        barre.style.position = 'absolute';
        barre.style.fontSize = '14px';
        barre.style.textAlign = 'center';
        barre.style.color = joueur.color;
        div.appendChild(barre);

      };

      // Mettre à jour sa position
      var updateDivPosition = function(joueur) {
        var div = window.document.getElementById(joueur.id);
        div.style.top = joueur.y + 'px';
        div.style.left = joueur.x + 'px';
      };

      // Supprimer s'il se déconnecte
      var removeDiv = function(divId) {
        var div = window.document.getElementById(divId);
        if (div) {
          window.setTimeout(function() {
            div.parentNode.removeChild(div);
          }, 500);
        }
      };

      // Créer mon Interface Score
      var creerMaBarreDeScore = function(donnees) {
        var div = window.document.createElement('div');
        div.setAttribute('id', 'barreDeScore');
        div.style.height = donnees.height;
        div.style.width = donnees.width;
        div.style.top = donnees.top;
        div.style.margin = donnees.margin;
        div.style.position = donnees.position;
        div.style.transition = donnees.transition;
        div.style.color = donnees.color;
        div.style.fontSize = donnees.fontSize;
        document.body.appendChild(div);
        $("#barreDeScore").html("<p>" + data.joueurActuel.score + " globes</p>")
      }

      // Créer mon Interface Score
      var creerBarreDeScoreGeneral = function(donnees) {
        var div = window.document.createElement('div');
        div.setAttribute('id', 'barreDeScoreGeneral');
        div.style.height = donnees.height;
        div.style.width = donnees.width;
        div.style.top = donnees.top;
        div.style.right = donnees.right;
        div.style.border = donnees.border;
        div.style.margin = donnees.margin;
        div.style.position = donnees.position;
        div.style.transition = donnees.transition;
        document.body.appendChild(div);
      }

      // Créer ma barre de vie
      var creerMaBarreDeVie = function(donnees) {
        var div = window.document.createElement('div');
        div.setAttribute('id', 'barre');
        div.style.height = donnees.height;
        div.style.width = data.joueurActuel.life + 'px';
        div.style.maxWidth = '200px';
        div.style.margin = donnees.margin;
        div.style.overflow = donnees.overflow;
        div.style.transition = donnees.transition;
        div.style.position = donnees.position;
        div.style.backgroundColor = donnees.backgroundColor;
        document.body.appendChild(div);
      }

      // Créer un globe de vie
      var creerUnGlobeDeVie = function(globe) {
        var div = window.document.createElement('img');
        div.setAttribute('class', 'heart');
        div.style.top = globe.top;
        div.style.left = globe.left;
        div.src = globe.src;
        div.id = globe.id;
        div.style.width = globe.width;
        div.style.height = globe.height;
        div.style.position = globe.position;
        div.style.overflow = globe.overflow;
        div.style.backgroundColor = globe.backgroundColor;
        div.style.borderRadius = globe.borderRadius;
        div.style.padding = globe.padding;
        window.document.body.appendChild(div);

        // Quand je clique sur le globe de vie, il disparaît, ma vie remonte et je gagne 1 point
        $('#' + globe.id).on('click', function() {
          data.joueurActuel.life = data.joueurActuel.life + 40;
          data.joueurActuel.score += 1;
          $("#barreDeScore").html("<p>" + data.joueurActuel.score + " globes</p>")
          socketIo.emit('globeEnglouti', {id: globe.id});
          socketIo.emit('scoreAugmente', {score: data.joueurActuel.score});
        })
      }

      function Lave() {
        data.joueurActuel.life = data.joueurActuel.life - 15;
        if (data.gameOver == false) {
          console.log(data.joueurActuel.life);
        }
        var div = window.document.getElementById('barre');
        div.style.width = data.joueurActuel.life + 'px';
        if (data.joueurActuel.life >= 100) {
          div.style.backgroundColor = data.couleurs.lm;
        } else if (data.joueurActuel.life >= 50) {
          div.style.backgroundColor = data.couleurs.y;
        } else if (data.joueurActuel.life >= 1) {
          div.style.backgroundColor = data.couleurs.r;
        } else if (data.joueurActuel.life <= 0) {
          console.log('joueur mort');
          GameOver();
        }
      }
      var idLave = setInterval(Lave, 1000); // La Lave tue tout le monde

      function GameOver() {
        clearInterval(idLave);
        socketIo.emit('mortDunJoueur');
        data.gameOver = true;
        $('#gameover').css('top', '0%');
        console.log('Interval cleared.');
      }

      /*


    Partie Socket


    */

      // Envoi des coordonnées temps réel quand joueur connecté
      socketIo.on('myJoueurCreated', function(myJoueur) {
        window.document.addEventListener('mousemove', function(event) {
          if (data.gameOver == false) {
            socketIo.emit('moveJoueur', {
              x: event.clientX - 72,
              y: event.clientY - 125
            });
          }
        });
      });

      // Maj Position des joueurs
      socketIo.on('updateJoueurPosition', function(joueur) {
        updateDivPosition(joueur);
      });

      // Globes
      socketIo.on('unNouveauGlobeApparait', function(data) {
        creerUnGlobeDeVie(data);
      });
      socketIo.on('creerUnGlobe', function(data) {
        creerUnGlobeDeVie(data);
      });

      // On clique sur un globe, il disparaît pour tous
      socketIo.on('globeDisparait', function(data) {
        $('#' + data.id).remove();
      })

      // Créer la barre de vie
      socketIo.on('creerLaBarreDeVie', function(data) {
        creerMaBarreDeVie(data);
      })

      // Créer la barre de score du perso
      socketIo.on('creerLaBarreDeScore', function(data) {
        creerMaBarreDeScore(data);
      })

      // Créer la barre de score générale
      socketIo.on('creerLaBarreDeScoreGeneral', function(data) {
        creerBarreDeScoreGeneral(data);
      })

      // Un nouveau joueur se connecte, je l'ajoute
      socketIo.on('ajoutDunNouveauJoueur', function(joueur) {
        console.log(joueur);
        creerUnJoueur(joueur);
      });

      // Un joueur se déconnecte, je le supprime
      socketIo.on('removeJoueur', function(divId) {
        console.log('Ce joueur quitte la partie: ', divId);
        removeDiv(divId);
      });

      // Je suis un nouveau joueur, je récupère les anciens et les rajoute
      socketIo.on('jeRecupLaListeDesJoueurs', function(liste) {
        var array = $.map(liste, function(value, index) {
          return [value];
        });
        array.forEach(function(joueur) {
          creerUnJoueur(joueur);
        });
      });

      // Je crée le tableau
      socketIo.on("creeLeTableau", function(data) {
        console.log(data);
        data.forEach(function(idNouveauxJoueurs) {
          $('#barreDeScoreGeneral').append('<p>' +
            '<span>' + idNouveauxJoueurs.nom + '</span>' + ' ' + '<span class="right" style="color:#f7d411;">' + idNouveauxJoueurs.score + '</span>' + '</p>')
        })
      });

      // Un joueur meurt
      socketIo.on('jeVeuxMonID', function(monFuckingId) {
        console.log("Je suis mort :" + monFuckingId);
        // Si un personnage meurt, il se transforme en tête de mort
        $("#" + monFuckingId).removeClass('storm_marche').addClass('mort')
      })

      /* A FAIRE */

      // Mettre à jour le tableau renvoyé par majTableau
      socketIo.on('majTableau', function(data) {
        // console.log("Mise à jour du tableau des scores");
        // console.log(data);
        $('#barreDeScoreGeneral').empty();
        data.forEach(function(idNouveauxJoueurs) {
          $('#barreDeScoreGeneral').append('<p>' +
            '<span>' + idNouveauxJoueurs.nom + '</span>' + ' ' + '<span class="right" style="color:#f7d411;">' + idNouveauxJoueurs.score + '</span>' + '</p>')
        })
      })

    };

    // Interface Générale

    data.startButton.addEventListener('click', function() {
      document.body.removeChild(data.startScreen);
    }) // 1ère page: Start button

    data.trump.addEventListener('click', function() {
      data.kim = false;
      console.log(data.kim);
      data.trump.style.border = '1px solid #f7d411';
      data.kimkardashian.style.border = 'none';
    }) // Ne pas choisir kim

    data.kimkardashian.addEventListener('click', function() {
      data.kim = true;
      console.log(data.kim);
      data.kimkardashian.style.border = '1px solid #f7d411';
      data.trump.style.border = 'none';
    }) // Choisir kim

    $('#inscription').on('submit', function(event) {
      event.preventDefault();
      socketIo.emit('jenvoieMonNom', {
        nom: $('#player_name').val(),
        kim: data.kim,
        score: data.joueurActuel.score
      });
      document.body.removeChild(data.beforeScreen);
      start();
    })

    // Si le pseudo est déjà pris
    socketIo.on('pseudoDejaPris', function() {
      $('#inscription').on('submit', function(event) {
        event.preventDefault();
      });
      console.log("ca marche");
      $('#alerte').css('top', '0%');
    })

  }); // DOMContentLoaded

}(window, io)); // IIFE

// Supprimer l'espace comme sélection de caractère pour le pseudo