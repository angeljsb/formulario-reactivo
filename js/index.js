window.addEventListener("DOMContentLoaded", (e) => {
	const container = document.getElementById("app-main");

	container.appendChild(new App().get());
});
