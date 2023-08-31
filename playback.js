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

const new_frame_ptr = DebugSymbol.fromName("new_frame").address;

const savestates_load_pj64_zip_ptr = DebugSymbol.fromName("savestates_load_pj64_zip").address

console.log("savestate_load ptr");
console.log(savestates_load_pj64_zip_ptr);

Interceptor.attach(savestates_load_pj64_zip_ptr, {
    onEnter(args) {
        console.log("inside of savestates_load_pj64_zip");
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

//we do the first row manually, so that we can remember the first frame
let row = smt.step();


let first_frame = row[0];

//indexed by frame
let control_info = [[0, 0, 0, 0]];
//the player              the controls

control_info[0][row[1]] = row[2];


//console.log(control_info);
row = smt.step()
while(row !== null){
    const [frame, player, control] = row;
    //first, we need to know if this is the first time we are seeing this frame
    let index = frame - first_frame;
    if (control_info.length = index){
        control_info[index] = [0, 0, 0, 0];
    }
    //then, update our array
    control_info[index][player] = control;
    //prep the next row
    row = smt.step();
}

console.log("control_info: ", control_info);
//load the savestate
const g_dev_addr = getPrivateSymbol("g_dev");
const filename = Memory.allocUtf8String("savestates_pj64_initial.zip");


let loaded = false

Interceptor.attach(new_frame_ptr, {
    onEnter(args) {
        if (!loaded) {
            console.log("loading", g_dev_addr, filename);
            savestates_load_pj64_zip(g_dev_addr, filename);
            console.log("finished loading");
            loaded = true;
        }
    }
});


//now do playback logic

console.log("forcing frame");
//first, we want to force the frame to the first frame in our controls DB
l_CurrentFrame_addr.writeInt(first_frame);
console.log("frame now: ", l_CurrentFrame_addr.readInt());

/*Interceptor.attach(GetKeys, {
    onEnter(args) {
        if (args[0].compare(0) == 0) {
            console.log("on ENTER!")
            this.playerController = true;
            this.playerButtonPtr = args[1];
        }
    },
    onLeave(retval) {
        if (this.playerController) {
            console.log("start leave");
            const current_frame = l_CurrentFrame_addr.readInt();
            console.log("current frame: ", current_frame);
            let index = current_frame - first_frame;
            console.log("index: ", index);
            if (control_info.length <= index){
                //we should stop playback
                //let's just throw an error!
                //(great idea)
                console.log("end of control_info");
                throw new Error("End of Recording");
            }

            console.log("replacing: ", this.playerButtonPtr.readU32());
            //else, we replace the button pointer with our recorded controls
            this.playerButtonPtr.writeU32(control_info[index][0]);
            console.log("with: ", this.playerButtonPtr.readU32());
        }
    }
  });*/
