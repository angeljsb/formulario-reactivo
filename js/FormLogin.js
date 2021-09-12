const FormLogin = Reactive.createComponent({
	initialState: { ready: false },
	definitions: function () {
		this.inputs = [new ControlledInput(), new ControlledInput()];
		const passwordValidation = (val) =>
			val.length >= 8 &&
			[/[a-z]/, /[A-Z]/, /\d/].every((regex) => regex.test(val));
		this.inputProps = [
			{
				type: "email",
				name: "email",
				label: "Correo electrónico",
				required: true,
				id: "email",
				validation: (val) => /.+@.+/.test(val),
				getMessage: (val) => {
					if (!val) {
						return "El campo es requerido";
					}
					if (!val.includes("@")) {
						return "Falta el caracter @";
					}
					if (!/@.+/.test(val)) {
						return "Debe haber algo luego del caracter @";
					}
				},
			},
			{
				type: "password",
				name: "password",
				label: "Contraseña",
				id: "password",
				required: true,
				validation: passwordValidation,
				getMessage: (val) =>
					passwordValidation(val)
						? ""
						: val.length < 8
						? "La contraseña debe tener un mínimo de 8 caracteres"
						: "La contraseña debe tener al menos una minuscula" +
						  " una mayuscula y un caracter númerico",
			},
		];
		const onChangeReady = () => {
			this.setState({ ready: this.inputs.every((input) => input.state.ready) });
		};
		this.inputs.forEach((input) => input.onChangeState("ready", onChangeReady));
	},
	template: function () {
		const { ready } = this.state;

		const element = create(
			"form",
			{ method: "GET", action: "#", className: "form" },
			[
				html(`<h2 class="form__title">Iniciar Sesión<h2>`),
				...this.inputs.map((input, index) => input.get(this.inputProps[index])),
				html(
					`<button type="submit" ${
						ready ? "" : "disabled"
					} class="form__submit">Enviar</button>`
				),
			]
		);

		return element;
	},
});
