console.log("¡El archivo JS está conectado y funcionando!");

// Usamos la API de CheapShark (Store 1 = Steam). Tiene CORS nativo, NO requiere proxy.
const API_URL = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=12&sortBy=Metacritic';

// URL base para obtener las imágenes oficiales de Steam usando el ID del juego
const STEAM_IMAGE_URL = 'https://cdn.cloudflare.steamstatic.com/steam/apps/';

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
            <h1 id="store-title">Destacados y Recomendados</h1>
            <p class="store-catalog__description">
                Explora algunos de los videojuegos más populares disponibles en Steam.
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

    retryButton.addEventListener('click', cargarJuegos);

    // OBTENER VIDEOJUEGOS

    async function obtenerJuegos() {
        console.log("Consultando a la API...");

        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(`HTTP_${respuesta.status}`);
        }

        const datos = await respuesta.json();
        
        if (!datos || datos.length === 0) {
            throw new Error('RESPUESTA_INVALIDA');
        }

        return datos;
    }

    // CREAR TARJETAS

    function crearTarjeta(juego) {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'game-card';

        const poster = document.createElement('div');
        poster.className = 'game-card__poster';

        const imagen = document.createElement('img');
        imagen.className = 'game-card__image';
        
        // Reconstruimos la URL de la imagen de alta calidad usando el steamAppID
        imagen.src = `${STEAM_IMAGE_URL}${juego.steamAppID}/header.jpg`;
        imagen.alt = `Imagen de ${juego.title}`;
        imagen.loading = 'lazy';

        imagen.addEventListener('error', () => {
            imagen.src = crearImagenAlternativa();
            imagen.classList.add('game-card__image--fallback');
        }, { once: true });

        poster.appendChild(imagen);

        const contenido = document.createElement('div');
        contenido.className = 'game-card__content';

        const titulo = document.createElement('h2');
        titulo.className = 'game-card__title';
        titulo.textContent = juego.title;

        // Determinamos el precio (CheapShark lo devuelve en dólares)
        const contenedorPrecio = document.createElement('p');
        contenedorPrecio.className = 'game-card__price';
        
        if (parseFloat(juego.salePrice) === 0) {
            contenedorPrecio.textContent = 'Gratuito';
        } else {
            contenedorPrecio.textContent = `$${juego.salePrice} USD`;
        }

        contenido.append(titulo, contenedorPrecio);
        tarjeta.append(poster, contenido);

        return tarjeta;
    }

    // IMAGEN ALTERNATIVA

    function crearImagenAlternativa() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg"
                width="460" height="215" viewBox="0 0 460 215">
                <rect width="460" height="215" fill="#2A475E" />
                <text x="230" y="108" fill="#C7D5E0" font-family="Arial, sans-serif" font-size="22" text-anchor="middle" dominant-baseline="middle">
                    Imagen no disponible
                </text>
            </svg>
        `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    // MOSTRAR VIDEOJUEGOS

    function mostrarJuegos(juegos) {
        ocultarLoading();
        errorDiv.hidden = true;
        gamesGrid.replaceChildren();

        const fragmento = document.createDocumentFragment();
        juegos.forEach(juego => {
            fragmento.appendChild(crearTarjeta(juego));
        });
        gamesGrid.appendChild(fragmento);
    }

    // MANEJO DE ESTADOS 

    function mostrarLoading() {
        loadingDiv.hidden = false;
        errorDiv.hidden = true;
        gamesGrid.replaceChildren();
    }

    function ocultarLoading() {
        loadingDiv.hidden = true;
    }

    function mostrarError(mensaje) {
        ocultarLoading();
        errorMessage.textContent = mensaje;
        errorDiv.hidden = false;
        gamesGrid.replaceChildren();
    }

    function obtenerMensajeError(error) {
        if (error.message === 'HTTP_429') return 'Demasiadas solicitudes. Espera un momento.';
        if (error.message === 'RESPUESTA_INVALIDA') return 'La API no devolvió datos válidos.';
        return 'No se pudieron cargar los videojuegos. Inténtalo nuevamente.';
    }

    //INICIAR CARGA

    async function cargarJuegos() {
        mostrarLoading();
        try {
            const juegos = await obtenerJuegos();
            mostrarJuegos(juegos);
        } catch (error) {
            console.error('Error al cargar los videojuegos:', error);
            mostrarError(obtenerMensajeError(error));
        }
    }

    cargarJuegos();
}