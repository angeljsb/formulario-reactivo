const ControlledInput = Reactive.createComponent({
	initialState: { ready: false, message: "", value: "" },
	definitions: function () {
		this.generatedId = Math.random().toString(16).substring(5, 10);
	},
	template: function () {
		const { ready, message } = this.state;
		const { label, ...inputAttrs } = this.props;
		inputAttrs.id = inputAttrs.id || this.generatedId;
		inputAttrs.type = inputAttrs.type || "text";

		const input = create("input", {
			className: "controlled-input__input",
			...inputAttrs,
		});

		const element = create(
			"div",
			{
				className: `controlled-input controlled-input--${
					ready ? "success" : "error"
				}`,
			},
			[
				label
					? html(
							`<label for="${inputAttrs.id}" class="controlled-input__label">
						${label}
					</label>`
					  )
					: null,
				input,
				message
					? create("div", {
							className: "controlled-input__message",
							innerHTML: message,
					  })
					: null,
			].filter((val) => Boolean(val))
		);

		return element;
	},
	events: [
		{
			type: "keyup",
			listener: function (e) {
				const val = e.target.value;
				this.setState({
					value: val,
					ready: this.props.validation
						? this.props.validation(val)
						: this.state.ready,
					message: this.props.getMessage
						? this.props.getMessage(val)
						: this.state.message,
				});
				e.target.focus();
			},
			selector: ".controlled-input__input",
		},
	],
});
