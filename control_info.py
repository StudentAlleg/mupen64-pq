import tkinter
from customtkinter import *
import sys
import subprocess
import frida
import configparser

#Notes: it currently needs to be ran from the folder where mupen64-ui-console.exe is, so that it can get the proper plugins for stuff like video and sound etc.
#Notes: this can be changed by adding command line arguments. #TODO

#TODO:
#Remember last selected mupen64-ui-console and game, probably through a .cfg file
#Add a selector for script (and remember it)
#Give better feedback on recording
#Allow the app to be launched from anywhere, by providing command line arguments to the plugin directory
#Do something with the SQL data here
#Add customization for where to record the control data



#setup config
config_file = "control_info.ini"
config_p = configparser.ConfigParser()

try:
    config_p.read(config_file)
except FileNotFoundError:
    f = open(config_file, "wr")
    f.write("[DEFAULT]")
    f.close()
    config_p.read(config_file)

if "mupen64plus-plugins" not in config_p["DEFAULT"]:
    config_p["DEFAULT"]["mupen64plus-plugins"] = "none"

if "mupen64plus-ui-console" not in config_p["DEFAULT"]:
    config_p["DEFAULT"]["mupen64plus-ui-console"] = "none"

if "n64-game" not in config_p["DEFAULT"]:
    config_p["DEFAULT"]["n64-game"] = "none"

if "control-script" not in config_p["DEFAULT"]:
    config_p["DEFAULT"]["control-script"] = "control_info.js"

if "save-script" not in config_p["DEFAULT"]:
    config_p["DEFAULT"]["save-script"] = "savestate.js"

with open(config_file, "w") as configfile:
    config_p.write(configfile)

class App(CTk):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config_parser = configparser.ConfigParser()
        self.config_parser.read(config_file)

        self.recording = False
        self.session = None
        self.controlscript = None
        self.savescript = None

        self.main_frame = CTkFrame(self)
        self.main_frame.grid(row=0, column=0, padx=10, pady=10)
        
        self.title = CTkLabel(master=self.main_frame, text="Test Program")
        self.title.grid(row=0, column=0, pady=(0, 20))

        self.exe_button = CTkButton(master=self.main_frame,
                                    text="Select the mupen64plus-ui-console.exe",
                                    command=self.select_console)
        self.exe_button.grid(row=1, column=0,pady=(0, 20))

        self.game_button = CTkButton(master=self.main_frame,
                                    text="Select the N64 game",
                                    command=self.select_game)
        self.game_button.grid(row=1, column=1,pady=(0, 20))
        
        self.plugin_button = CTkButton(master=self.main_frame,
                                    text="Select the directory path",
                                    command=self.select_plugin)
        self.plugin_button.grid(row=1, column=2,pady=(0, 20))
        
        self.info_text = CTkTextbox(self.main_frame)
        self.info_text.grid(row=2, column=0,pady=(0, 20))

        self.exe_run_button = CTkButton(master=self.main_frame,
                                    text="Launch",
                                    command=self.run_mupen64plus)
        self.exe_run_button.grid(row=3, column=0,pady=(0, 20))

        self.record_button =CTkButton(master=self.main_frame,
                                    text="Start Recording",
                                    command=self.record_function,
                                    state="disabled")
        self.record_button.grid(row=3, column=1,pady=(0, 20))

        self.okButton = CTkButton(master=self.main_frame, text="Quit", command=self.ok_function)
        self.okButton.grid(row=4, column=0, pady=(0, 20))
        self.main_frame.pack()
        #self.main_frame.pack_propagate(True)
        #self.geometry(f"{self.main_frame.winfo_width()}x{self.main_frame.winfo_height()}")

        self.plugin_path = self.config_parser["DEFAULT"]["mupen64plus-plugins"]
        self.exe_name = self.config_parser["DEFAULT"]["mupen64plus-ui-console"]
        self.game_name = self.config_parser["DEFAULT"]["n64-game"]
        self.update_info_text()

    def _setup_frida(self):
        #set up the control script
        control_file = self.config_parser["DEFAULT"]["control-script"]
        print(control_file)
        self.session = frida.attach("mupen64plus-ui-console.exe")
        f = open(control_file, "r")
        self.controlscript = self.session.create_script(
            f.read()
        )
        f.close()

        #set up the save script
        save_file = self.config_parser["DEFAULT"]["save-script"]
        f = open(save_file, "r")
        self.savescript = self.session.create_script(
            f.read()
        )
        f.close()
        print("Frida Setup")
        

    def ok_function(self):
        self.quit()

    def select_console(self):
        filetypes = (
            ("Executables", "*.exe"),
            ("All files", "*.*")
        )

        #returns the name of the file
        self.exe_name = filedialog.askopenfilename(
            title="Select the mupen64plus-ui-console.exe",
            initialdir="./",
            filetypes=filetypes
        )
        self.update_info_text()

    def select_game(self):
        filetypes = (
            ("N64 Games", "*.z64"),
            ("All files", "*.*")
        )

        self.game_name = filedialog.askopenfilename(
            title="Select a N64 game",
            initialdir="./",
            filetypes=filetypes
        )
        self.update_info_text()

    def select_plugin(self):
        self.plugin_path = filedialog.askdirectory(
            title="Select the plugin path",
            initialdir="./"
        )
        self.update_info_text()

    def update_info_text(self):
        #maybe a better way to do this
        exe = self.exe_name
        game = self.game_name
        plugin = self.plugin_path
        self.info_text.delete("0.0", "end")
        self.info_text.insert("0.0", f"plugin-path: {plugin}\nui-console path: {exe}\ngame path: {game}")

    def run_mupen64plus(self):
        #should run mupen64plus-ui-console with the specified game name
        subprocess.Popen([self.exe_name, 
                          "--configdir", self.plugin_path, 
                          "--datadir", self.plugin_path, 
                          "--plugindir", self.plugin_path,
                          #"--debug",
                          self.game_name,])
        self._setup_frida()
        #enable the record button
        self.record_button.configure(state="normal")
    
    def record_function(self):
        
        if self.session is None:
            #We cannot do anything currently
            #TODO: popup
            return
        
        #stop the recording
        if self.recording:
            self.recording = False

            #you actually need to restart after reloading
            self.controlscript.unload()
            self.savescript.unload()
            print("Stopped Recording")
            self.record_button.configure(text="Must Restart to Record again", state="disabled")
        #start the recording
        else:
            self.controlscript.load()
            self.savescript.load()
            self.recording = True
            print("Started Recording")
            self.record_button.configure(text="Stop Recording")
        pass

    def save_config(self):
        self.config_parser["DEFAULT"]["mupen64plus-plugins"] = self.plugin_path
        self.config_parser["DEFAULT"]["mupen64plus-ui-console"] = self.exe_name
        self.config_parser["DEFAULT"]["n64-game"] = self.game_name

        with open(config_file, "w") as configfile:
            self.config_parser.write(configfile)
            configfile.close()

    def quit(self) -> None:
        #save the config
        self.save_config()
        return super().quit()

if __name__ == "__main__":
    app = App()
    #app.geometry("400x240")
    app.mainloop()