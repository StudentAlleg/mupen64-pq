//this is a reference to savestates.c:1908
//basically, we are giving ourselves the ability to call this function

console.log("starting savestate");

function getPrivateSymbol(name) {
	return Module.enumerateSymbols("mupen64plus.dll").filter(e => e.name == name)[0].address
}

const savestates_save_pj64_ptr = DebugSymbol.fromName("savestates_save_pj64").address

const savestates_save_pj64 = new NativeFunction(
	savestates_save_pj64_ptr,
	'int', //return type
	[	'pointer'/* dev */,
		'pointer'/* handle (passed as first arg to writer) */,
		'pointer'/* write_func (int(void*handle, void* data, int len))*/,
	]);


let last_save_data;

//this is our own function, so that we can save data to where we want to
const write_func = new NativeCallback(function(handle, data, len) {
	last_save_data = Memory.dup(data, len);
	return len.toNumber(); //return non-0 to indicate we have successfully saved
}, 'int', ['pointer', 'pointer', 'size_t']);


const g_dev_addr = getPrivateSymbol("g_dev");

const ignored_handle = ptr(42);
savestates_save_pj64(g_dev_addr, ignored_handle, write_func)
console.log(hexdump(last_save_data, {length: 1024}));

Interceptor.attach(savestates_save_pj64_ptr, {
    onEnter(args) {
        console.log(args)
    }
})