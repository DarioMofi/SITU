/**
 * IntroAnimation.js
 * Maneja la carga y animación del mapa SVG exportado de QGIS para la portada.
 */

async function initIntroMap() {
    const container = d3.select("#intro-map-container");
    if (container.empty()) return;

    // Limpiar contenedor por si acaso
    container.selectAll("*").remove();

    try {
        // Cargar el archivo SVG directamente
        const svgData = await d3.xml("SVG.svg");
        const importedNode = document.importNode(svgData.documentElement, true);
        
        // Añadir el SVG al contenedor
        const svgElement = container.node().appendChild(importedNode);
        const svg = d3.select(svgElement);

        // Ajustar el SVG para que sea responsivo y tenga el ID correcto
        svg.attr("id", "intro-map-svg")
           .attr("width", "100%")
           .attr("height", "100%")
           .attr("preserveAspectRatio", "xMidYMid meet")
           .style("pointer-events", "auto"); // Permitir interacción

        // Identificar las capas por sus nombres de QGIS
        const municipalLayer = svg.select("[id*='Lim_Mun']");
        const stateLayer = svg.select("[id*='Lim_Est']"); 
        // Ocultar capas de fondo y rectángulos que actúan como lienzo (típico de QGIS/Inkscape)
        svg.selectAll("rect").style("display", "none");
        svg.select("[id*='Fondo']").style("display", "none");
        svg.select("[id*='Página']").style("display", "none");
        svg.select("[id*='Page']").style("display", "none");

        // Mover y escalar polígonos (ajustar valores según sea necesario)
        const offsetLeft = -450; 
        const offsetTop = -150; // Mover hacia arriba para no cortar abajo
        const scaleFactor = 1.15; 
        const transformStr = `translate(${offsetLeft}, ${offsetTop}) scale(${scaleFactor})`;
        
        if (!municipalLayer.empty()) municipalLayer.attr("transform", transformStr);
        if (!stateLayer.empty()) stateLayer.attr("transform", transformStr);

        // Estilizar municipios
        if (!municipalLayer.empty()) {
            const muniPaths = municipalLayer.selectAll("path");
            
            muniPaths
                .attr("class", "municipality-boundary")
                .style("fill", "#fdfdfd")
                .style("fill-opacity", "1")
                .attr("pointer-events", "all");

            // Interactividad
            muniPaths
                .on("mouseover", function() {
                    d3.select(this)
                        .style("fill-opacity", "0") // Ver fondo
                        .style("stroke", "#8d2727")
                        .style("stroke-width", "1.5px");
                    
                    this.parentNode.appendChild(this);
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("fill", "#fdfdfd")
                        .style("fill-opacity", "1")
                        .style("stroke", "#666666")
                        .style("stroke-width", "0.5px");
                });
        }

        // Estilizar capa estatal si existe
        if (!stateLayer.empty()) {
            stateLayer.selectAll("path")
                .style("fill", "none")
                .style("stroke", "#222121")
                .style("stroke-width", "2px")
                .attr("pointer-events", "none");
        }

        console.log("Mapa SVG de QGIS cargado e interactivo.");

    } catch (error) {
        console.error("Error cargando el mapa SVG:", error);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    initIntroMap();
    initIntroCanvas();
});

/**
 * ANIMACIÓN DE CANVAS (Fondo introducción)
 * Portada de la versión anterior integrada para dinamismo.
 */
function initIntroCanvas() {
    const canvas = document.getElementById('intro-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const dpr = window.devicePixelRatio || 1;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        
        // Ajustar resolución física del canvas
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Resetear transformaciones previas antes de escalar de nuevo
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor(x, y, dx, dy, life) {
            this.x = x; this.y = y; this.dx = dx; this.dy = dy;
            this.life = life; this.maxLife = life;
            this.history = [{ x, y }];
            this.color = Math.random() > 0.5 ? 'rgba(123, 29, 46, ' : 'rgba(196, 151, 58, '; // Granate y Dorado
        }
        update() {
            this.x += this.dx;
            this.y += this.dy;
            this.dx += (Math.random() - 0.5) * 0.4;
            this.dy += (Math.random() - 0.5) * 0.4;

            if (Math.random() < 0.015 && particles.length < 150) {
                particles.push(new Particle(this.x, this.y, this.dx + (Math.random() - 0.5), this.dy + (Math.random() - 0.5), this.life));
            }

            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > 40) this.history.shift();
            this.life--;
        }
        draw() {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.strokeStyle = this.color + alpha + ')';
            ctx.lineWidth = 1.8; // Un poco más grueso para suavizar
            ctx.stroke();
        }
    }

    function spawn() {
        if (particles.length < 60) {
            const x = Math.random() * width;
            const y = height + 10;
            particles.push(new Particle(x, y, (Math.random() - 0.5) * 2, -Math.random() * 3 - 1, 150 + Math.random() * 150));
        }
    }

    function animate() {
        // Efecto de rastro (mantiene parte de los frames anteriores para fluidez)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, width, height);

        spawn();

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0 || particles[i].y < 0 || particles[i].x < 0 || particles[i].x > width) {
                particles.splice(i, 1);
            }
        }

        if (!document.getElementById('intro-screen').classList.contains('hidden')) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}
