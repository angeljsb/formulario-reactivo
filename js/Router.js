const Router = Reactive.createComponent({
	initialState: { isLogin: true },
	definitions: function () {
		this.loginForm = new FormLogin();
		this.signupForm = new FormSignup();
		this.getLoginForm = () => {
			return this.loginForm.get();
		};
		this.getSignupForm = () => {
			return this.signupForm.get();
		};
		this.currentFormComponent = () =>
			this.state.isLogin ? this.loginForm : this.signupForm;
		this.getCurrentForm = () =>
			this.state.isLogin ? this.getLoginForm() : this.getSignupForm();
	},
	template: function () {
		const { isLogin } = this.state;

		const element = create("div", { className: "router" }, [
			this.getCurrentForm(),
			create("div", { className: "router__foot" }, [
				html(
					`<a href="#app-main" class="router__switch">${
						isLogin ? "No tengo usuario" : "Ya tengo una cuenta"
					}</a>`
				),
			]),
		]);

		return element;
	},
	events: [
		{
			type: "click",
			listener: function (e) {
				this.setState({ isLogin: !this.state.isLogin });
			},
			selector: ".router__switch",
		},
	],
});
