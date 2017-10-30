module RemoteTrainer.Data {
    export class Category {
        public name: string;
        public colorLight: string;
        public colorDark: string;

        constructor(name: string, light: string, dark: string) {
            this.name = name;
            this.colorLight = light;
            this.colorDark = dark;
        }
    }
}