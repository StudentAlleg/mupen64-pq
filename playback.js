//Should probably record the game
//TODO: make a frida js program that writes info about the control state to a sqlite database
console.log("Frida Find Functions");

let db = SqliteDatabase.open("control_info.db", {flags: ["readonly"]});

//db.exec("CREATE TABLE IF NOT EXISTS controls(frame INT, player UNSIGNED TINYINT, controlint UNSIGNED INT);");

//gets a private symbol from the main dll
function getPrivateSymbol(name) {
	return Module.enumerateSymbols("mupen64plus.dll").filter(e => e.name == name)[0].address
}

//gets a private symbol from the input dll
function getPrivateInputSymbol(name) {
    return Module.enumerateSymbols("mupen64plus-input-sdl.dll").filter(e => e.name == name)[0].address
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

//we dont need this
//we want the value defined at github.com/mupen64plus/mupen64plus-input-sdl/blob/master/src/plugin.h#L159
//SController[4]
const controller_addr = getPrivateInputSymbol("controller")

//int
const l_CurrentFrame_addr = getPrivateSymbol("l_CurrentFrame");

// print address of functions
let result = DebugSymbol.fromName("GetKeys")

let GetKeys = ptr(result.address)
console.log(GetKeys)

const info = db.prepare("SELECT * FROM controls ORDER BY ROWID ASC LIMIT 1");
console.log(info)
let current_frame = info[0];

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
        }
    }
  });
