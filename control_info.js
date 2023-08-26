
//TODO: make a frida js program that writes info about the control state to a sqlite database
console.log("Frida Find Functions");

let db = SqliteDatabase.open("control_info.db", {flags: ["create", "readwrite"]});

db.exec("CREATE TABLE IF NOT EXISTS controls(i INT PRIMARY KEY, player UNSIGNED TINYINT, controlint UNSIGNED INT);");

function getPrivateSymbol(name) {
	return Module.enumerateSymbols("mupen64plus.dll").filter(e => e.name == name)[0].address
}

//mupen64plus-input-sdl.dll

let results = Process.enumerateModules().filter(e => e.name.includes("upen"));

// Find list of function modules
// for (let module of results) {
//     console.log(module.enumerateSymbols());
// };


// Find functions with names
// let funs = DebugSymbol.findFunctionsMatching("*GetKey*")
// for (let fun of funs) {
//     let name = DebugSymbol.fromAddress(ptr(fun))
//     console.log(name)
// }

// print address of functions
let result = DebugSymbol.fromName("GetKeys")

let GetKeys = ptr(result.address)
console.log(GetKeys)

let i = 0;

Interceptor.attach(GetKeys, {
    onEnter(args) {
        if (args[0].compare(0) == 0) {
            //console.log("on ENTER!")
            this.playerController = true;
            this.playerButtonPtr = args[1];
        }
    },
    onLeave(retval) {
        if (this.playerController) {
            let button = this.playerButtonPtr.readU32()//.and(0xFF)
            //if (button != 0) {
            //    console.log("LEAVE", button)
            //}
            let statement = db.prepare("INSERT INTO controls VALUES (?, ?, ?);");
            //This should probably be a time/iteration value for playback
            statement.bindInteger(1, i);
            //This will only be the player controller, which is 0.
            statement.bindInteger(2, 0);
            //the controls
            statement.bindInteger(3, button);
            statement.step();
            i++;
        }
    }
  });
