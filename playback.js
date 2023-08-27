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

const savestates_load_pj64_ptr = DebugSymbol.fromName("savestates_load_pj64").address

console.log("savestate_load ptr");
console.log(savestates_load_pj64_ptr);

Interceptor.attach(savestates_load_pj64_ptr, {
    onEnter(args) {
        console.log("inside of savestates_load");
    }
})


const savestates_load_pj64 = new NativeFunction( //https://github.com/mupen64plus/mupen64plus-core/blob/master/src/main/savestates.c#L962
	savestates_load_pj64_ptr,
	'int', //return type
	[	'pointer'/* dev */,
		'pointer'/* char* filename */, 
		'pointer'/* handle (passed as first arg to writer) */,
		'pointer'/* read_func (int(void*handle, void* data, int len))*/,
	]);

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


//the basic idea is to load the save state, then iterate through this every frame and replace the controls
//with the recorded controls
let controls = db.prepare("SELECT * FROM controls ORDER BY frame ASC");
controls.step();
controls.log(info);
let current_frame = controls[0];
console.log(current_frame);

//load the savestate
let sqlload = db.prepare("SELECT * FROM savestates");
sqlload.step();
const savestate_to_load = sqlload[1];





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
