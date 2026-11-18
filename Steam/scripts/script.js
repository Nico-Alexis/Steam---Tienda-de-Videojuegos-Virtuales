/*==================================================
  STEAM - CARGA DEL CATÁLOGO DE VIDEOJUEGOS
  Archivo: scripts/script.js
==================================================*/

// Endpoint público de Steam.
const BASE_URL = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
const IMAGE_URL = 'https://cdn.cloudflare.steamstatic.com/steam/apps/';
const MAX_JUEGOS = 24;

// Esperamos a que el HTML esté cargado.
document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {

    const main = document.querySelector('main.main');

    if (!main) {
        console.error('No se encontró el elemento <main class="main">.');
        return;
    }

    // Creamos los elementos necesarios para el catálogo.
    main.innerHTML = `
        <section class="store-catalog" aria-labelledby="store-title">

            <h1 id="store-title">Catálogo de videojuegos</h1>

            <p class="store-catalog__description">
                Explora algunos de los videojuegos disponibles en Steam.
            </p>

            <div id="loading" class="store-message" role="status" aria-live="polite">
                Cargando videojuegos...
            </div>

            <div id="error" class="store-message store-message--error" role="alert" hidden>
                <p id="error-message"></p>
                <button id="retry-button" type="button">
                    Volver a intentar
                </button>
            </div>

            <div id="games-grid" class="games-grid"></div>

        </section>
    `;

    // Referencias a los elementos del HTML.
    const gamesGrid = document.getElementById('games-grid');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const retryButton = document.getElementById('retry-button');

    // Botón para volver a cargar los videojuegos.
    retryButton.addEventListener('click', cargarJuegos);

    //==============================================
    // OBTENER VIDEOJUEGOS
    //==============================================

    async function obtenerJuegos() {

        const respuesta = await fetch(BASE_URL);

        if (!respuesta.ok) {
            throw new Error(`HTTP_${respuesta.status}`);
        }

        const datos = await respuesta.json();

        const aplicaciones = datos?.applist?.apps;

        if (!Array.isArray(aplicaciones)) {
            throw new Error('RESPUESTA_INVALIDA');
        }

        // Filtramos aplicaciones que tengan nombre.
        return aplicaciones
            .filter(app => app.name && app.name.trim() !== '')
            .slice(0, MAX_JUEGOS);
    }

    //==============================================
    // CREAR TARJETAS
    //==============================================

    function crearTarjeta(juego) {

        const tarjeta = document.createElement('article');
        tarjeta.className = 'game-card';

        const poster = document.createElement('div');
        poster.className = 'game-card__poster';

        const imagen = document.createElement('img');

        imagen.className = 'game-card__image';
        imagen.src = `${IMAGE_URL}${juego.appid}/header.jpg`;
        imagen.alt = `Imagen de ${juego.name}`;
        imagen.loading = 'lazy';

        // Imagen alternativa si Steam no tiene una disponible.
        imagen.addEventListener('error', () => {

            imagen.src = crearImagenAlternativa();
            imagen.classList.add('game-card__image--fallback');

        }, { once: true });

        poster.appendChild(imagen);

        const contenido = document.createElement('div');
        contenido.className = 'game-card__content';

        const titulo = document.createElement('h2');
        titulo.className = 'game-card__title';
        titulo.textContent = juego.name;

        const id = document.createElement('p');
        id.className = 'game-card__id';
        id.textContent = `AppID: ${juego.appid}`;

        contenido.append(titulo, id);

        tarjeta.append(poster, contenido);

        return tarjeta;
    }


    //==============================================
    // IMAGEN ALTERNATIVA
    //==============================================

    function crearImagenAlternativa() {

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg"
                width="460" height="215" viewBox="0 0 460 215">

                <rect width="460" height="215" fill="#2A475E" />

                <text x="230" y="108"
                    fill="#C7D5E0"
                    font-family="Arial, sans-serif"
                    font-size="22"
                    text-anchor="middle"
                    dominant-baseline="middle">

                    Imagen no disponible

                </text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }


    //==============================================
    // MOSTRAR VIDEOJUEGOS
    //==============================================

    function mostrarJuegos(juegos) {

        ocultarLoading();

        errorDiv.hidden = true;

        gamesGrid.replaceChildren();

        if (juegos.length === 0) {

            mostrarError('Steam no devolvió videojuegos para mostrar.');

            return;
        }

        const fragmento = document.createDocumentFragment();

        juegos.forEach(juego => {

            fragmento.appendChild(crearTarjeta(juego));

        });

        gamesGrid.appendChild(fragmento);
    }


    //==============================================
    // MENSAJES DE CARGA
    //==============================================

    function mostrarLoading() {

        loadingDiv.hidden = false;

        errorDiv.hidden = true;

        gamesGrid.replaceChildren();
    }


    function ocultarLoading() {

        loadingDiv.hidden = true;
    }


    //==============================================
    // MOSTRAR ERRORES
    //==============================================

    function mostrarError(mensaje) {

        ocultarLoading();

        errorMessage.textContent = mensaje;

        errorDiv.hidden = false;

        gamesGrid.replaceChildren();
    }


    function obtenerMensajeError(error) {

        if (error.message === 'HTTP_401' || error.message === 'HTTP_403') {

            return 'Steam rechazó la solicitud. Comprueba la disponibilidad del servicio.';

        }

        if (error.message === 'HTTP_429') {

            return 'Se realizaron demasiadas solicitudes. Espera un momento e inténtalo nuevamente.';

        }

        if (error.message === 'RESPUESTA_INVALIDA') {

            return 'La respuesta recibida desde Steam no tiene el formato esperado.';

        }

        if (error instanceof TypeError) {

            return 'No se pudo conectar con Steam. Revisa tu conexión o comprueba si el navegador bloqueó la solicitud.';

        }

        return 'No se pudieron cargar los videojuegos. Inténtalo nuevamente.';
    }


    //==============================================
    // INICIAR CARGA
    //==============================================

    async function cargarJuegos() {

        mostrarLoading();

        try {

            const juegos = await obtenerJuegos();

            console.log(`${juegos.length} videojuegos obtenidos`);

            mostrarJuegos(juegos);

        } catch (error) {

            console.error('Error al cargar los videojuegos:', error);

            mostrarError(obtenerMensajeError(error));
        }
    }

    // Ejecutamos la carga inicial.
    cargarJuegos();

}