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

const savestates_load_pj64_zip_ptr = DebugSymbol.fromName("savestates_load_pj64_zip").address

console.log("savestate_load ptr");
console.log(savestates_load_pj64_zip_ptr);

Interceptor.attach(savestates_load_pj64_zip_ptr, {
    onEnter(args) {
        console.log("inside of savestates_load");
    }
})


const savestates_load_pj64_zip = new NativeFunction( //https://github.com/mupen64plus/mupen64plus-core/blob/master/src/main/savestates.c#L962
savestates_load_pj64_zip_ptr,
	'int', //return type
	[	'pointer'/* dev */,
		'pointer'/* char* filename */, 
	]);

//int
const l_CurrentFrame_addr = getPrivateSymbol("l_CurrentFrame");

// print address of functions
let result = DebugSymbol.fromName("GetKeys")

let GetKeys = ptr(result.address)
console.log(GetKeys)


//the basic idea is to load the save state, then iterate through this every frame and replace the controls
//with the recorded controls
//for now, lets just load the controls into an array of array, indexed by frame, with a list of all the controllers
//control_info[current_frame-first_frame] = [0,0,0,0]
let smt = db.prepare("SELECT * FROM controls ORDER BY frame ASC");
let row = smt.step();
smt.log(controls_db);

let first_frame = controls[0];
//let control_info[0] = [smt[2]];

while((row = smt.step()) !== null):
    const [frame, player, control] = row;



console.log(current_frame);

//load the savestate
const g_dev_addr = getPrivateSymbol("g_dev");
const filename = Memory.allocUtf8String("savestates_pj64_initial.zip");

savestates_load_pj64_zip(g_dev_addr, filename);

//now do playback logic

//first, we want to force the frame to the first frame in our controls DB
l_CurrentFrame_addr.writeInt(current_frame);

//lets prep our db.prepare statement
//TODO, write sql that accepts frame and player information as arguments to sort for the control
let controls_info = db.prepare("");



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
            current_frame = l_CurrentFrame_addr.readInt()
            //TODO: get the 


        }
    }
  });
