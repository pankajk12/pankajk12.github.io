document.addEventListener('DOMContentLoaded', function() {
    // --- Animated Background ---
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const particleCount = Math.floor(canvas.width * canvas.height / 20000);
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 1.5 + 0.5
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.x += p1.vx;
            p1.y += p1.vy;

            if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
            if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(20, 241, 149, 0.5)';
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(20, 241, 149, ${1 - dist / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });

    resizeCanvas();
    createParticles();
    animate();


    // --- Basic Page Setup (Menu, Header, etc.) ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    document.querySelectorAll('#mobile-menu a, nav a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });

    window.addEventListener('scroll', () => {
        document.getElementById('header').classList.toggle('shadow-lg', window.scrollY > 50);
    });

    document.getElementById('year').textContent = new Date().getFullYear();

    // --- Typewriter Effect ---
    const typewriterElement = document.getElementById('typewriter');
    const roles = ["A MERN Stack Developer", "A Full-Stack Engineer", "A Problem Solver"];
    let roleIndex = 0, charIndex = 0, isDeleting = false;
    function type() {
        const currentRole = roles[roleIndex];
        let text = isDeleting ? currentRole.substring(0, charIndex - 1) : currentRole.substring(0, charIndex + 1);
        charIndex += isDeleting ? -1 : 1;
        typewriterElement.textContent = text;
        let typeSpeed = isDeleting ? 75 : 150;
        if (!isDeleting && charIndex === currentRole.length) {
            typeSpeed = 2000; isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false; roleIndex = (roleIndex + 1) % roles.length; typeSpeed = 500;
        }
        setTimeout(type, typeSpeed);
    }
    if(typewriterElement) type();

    // --- Gemini API Integration ---
    const apiKey = ""; // Leave empty, will be handled by the environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // --- Feature 1: AI Bio Rewriter ---
    const rewriteBioBtn = document.getElementById('rewrite-bio-btn');
    const bioLoader = document.getElementById('bio-loader');
    const aboutMeContent = document.getElementById('about-me-content');

    rewriteBioBtn.addEventListener('click', async () => {
        const originalBio = Array.from(aboutMeContent.querySelectorAll('p')).slice(0, 2).map(p => p.textContent).join(' ');
        const prompt = `Rewrite the following professional bio to be more impactful and engaging for a potential employer, without losing the core information. Keep it to two paragraphs:\n\n"${originalBio}"`;
        
        bioLoader.classList.remove('hidden');
        rewriteBioBtn.disabled = true;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const newBio = result.candidates[0].content.parts[0].text;
                const paragraphs = newBio.split('\n').filter(p => p.trim() !== '');
                aboutMeContent.querySelector('p:nth-of-type(1)').textContent = paragraphs[0] || '';
                aboutMeContent.querySelector('p:nth-of-type(2)').textContent = paragraphs[1] || '';
            } else {
                throw new Error("Invalid response from API.");
            }
        } catch (error) {
            console.error("Error rewriting bio:", error);
            alert("Sorry, there was an error rewriting the bio. Please try again.");
        } finally {
            bioLoader.classList.add('hidden');
            rewriteBioBtn.disabled = false;
        }
    });

    // --- Feature 2: AI Project Suggester ---
    const suggestProjectBtn = document.getElementById('suggest-project-btn');
    const projectModal = document.getElementById('project-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalContent = document.getElementById('modal-content');

    suggestProjectBtn.addEventListener('click', async () => {
        const skills = Array.from(document.querySelectorAll('#skills-list li')).map(li => li.textContent.substring(1).trim()).join(', ');
        const prompt = `Based on the following skills: ${skills}, suggest a unique and impressive portfolio project idea. Provide a project title, a brief description (2-3 sentences), and a list of key technologies to use.`;
        
        modalContent.innerHTML = '<div class="flex justify-center items-center h-48"><span class="loader"></span></div>';
        projectModal.classList.remove('hidden');
        projectModal.classList.add('flex');

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            projectTitle: { type: "STRING" },
                            projectDescription: { type: "STRING" },
                            suggestedTechnologies: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        required: ["projectTitle", "projectDescription", "suggestedTechnologies"]
                    }
                }
            };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();

            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const data = JSON.parse(result.candidates[0].content.parts[0].text);
                modalContent.innerHTML = `
                    <h3 class="text-2xl font-bold text-brand-primary mb-2">${data.projectTitle}</h3>
                    <p class="text-brand-gray-300 mb-4">${data.projectDescription}</p>
                    <h4 class="font-semibold text-brand-light mb-2">Suggested Technologies:</h4>
                    <div class="flex flex-wrap gap-2">
                        ${data.suggestedTechnologies.map(tech => `<span class="bg-brand-gray-800 text-brand-primary text-sm font-semibold px-2 py-1 rounded">${tech}</span>`).join('')}
                    </div>
                `;
            } else { throw new Error("Invalid response from API."); }
        } catch (error) {
            console.error("Error suggesting project:", error);
            modalContent.innerHTML = `<p class="text-red-400">Sorry, there was an error generating a project idea. Please try again.</p>`;
        }
    });
    
    closeModalBtn.addEventListener('click', () => {
        projectModal.classList.add('hidden');
        projectModal.classList.remove('flex');
    });
});
