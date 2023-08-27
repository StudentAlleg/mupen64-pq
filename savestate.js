//this is a reference to savestates.c:1908
//basically, we are giving ourselves the ability to call this function

console.log("starting savestate");
let db = SqliteDatabase.open("control_info.db", {flags: ["create", "readwrite"]});

db.exec("CREATE TABLE IF NOT EXISTS savestates(i INT PRIMARY KEY, savestate BLOB);");

function getPrivateSymbol(name) {
	return Module.enumerateSymbols("mupen64plus.dll").filter(e => e.name == name)[0].address
}

const savestates_save_pj64_ptr = DebugSymbol.fromName("savestates_save_pj64").address
const savestates_save_pj64_zip_ptr = DebugSymbol.fromName("savestates_save_pj64_zip").address

console.log("savestate ptr");
console.log(savestates_save_pj64_zip_ptr);

Interceptor.attach(savestates_save_pj64_zip_ptr, {
    onEnter(args) {
        console.log("inside of savestates_save_pj64_zip");
    }
})

const savestates_save_pj64_zip = new NativeFunction(
	savestates_save_pj64_zip_ptr,
	'int', //return type
	[	'pointer'/* dev */,
		'pointer'/* char* filename */, 
	]);

const savestates_save_pj64 = new NativeFunction(
	savestates_save_pj64_ptr,
	'int', //return type
	[	'pointer'/* dev */,
		'pointer'/* char* filename */, 
		'pointer'/* handle (passed as first arg to writer) */,
		'pointer'/* write_func (int(void*handle, void* data, int len))*/,
	]);


let last_save_data;
let last_save_data_len;
//this is our own function, so that we can save data to where we want to
/*const write_func = new NativeCallback(function(handle, data, len) {
	console.log("start write fn");
	last_save_data = Memory.dup(data, len);
	last_save_data_len = len;
	return len.toNumber(); //return non-0 to indicate we have successfully saved
}, 'int', ['pointer', 'pointer', 'size_t']);*/

const g_dev_addr = getPrivateSymbol("g_dev");
console.log(g_dev_addr);
const ignored_handle = ptr(42);

const filename = Memory.allocUtf8String("savestates_pj64_initial.zip");

console.log("starting savestates_save_pj64_zip");

savestates_save_pj64_zip(g_dev_addr, filename);
/*let statement = db.prepare("INSERT INTO savestates VALUES (?, ?);");
//This should probably be a time/iteration value for playback
statement.bindInteger(1, 1);
//This will only be the player controller, which is 0.
statement.bindBlob(2, last_save_data.readByteArray(last_save_data_len));
statement.step();*/
