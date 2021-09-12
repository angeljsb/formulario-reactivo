const FormSignup = Reactive.createComponent({
	initialState: { ready: false },
	definitions: function () {
		this.inputs = [
			new ControlledInput(),
			new ControlledInput(),
			new ControlledInput(),
			new ControlledInput(),
		];
		this.inputs[0].setState({ ready: true });
		const passwordValidation = (val) =>
			val.length >= 8 &&
			[/[a-z]/, /[A-Z]/, /\d/].every((regex) => regex.test(val));
		this.inputProps = [
			{
				type: "text",
				name: "name",
				label: "Nombre",
			},
			{
				type: "email",
				name: "email",
				label: "Correo electrónico",
				required: true,
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
			{
				type: "password",
				name: "repeat-password",
				label: "Comprobar contraseña",
				required: true,
				validation: (val) => this.inputs[2].state.value === val,
				getMessage: (val) =>
					this.inputs[2].state.value === val
						? ""
						: "Debe coincidir con la contraseña",
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
				html(`<h2 class="form__title">Registro<h2>`),
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
