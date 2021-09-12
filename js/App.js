const App = Reactive.createComponent({
	initialState: { ready: false },
	definitions: function () {
		this.router = new Router();
		const forms = [];
		const verify = () => {
			const form = this.router.currentFormComponent();
			this.setState({ ready: form.state.ready });
		};
		this.router.onChangeAny(verify);
		this.router.loginForm.onChangeAny(verify);
		this.router.signupForm.onChangeAny(verify);
	},
	template: function () {
		const ready = this.state.ready;
		return create(
			"div",
			{
				className: `app__background app__background--${
					ready ? "success" : "error"
				}`,
			},
			[create("div", { className: "app__container" }, [this.router.get()])]
		);
	},
});
