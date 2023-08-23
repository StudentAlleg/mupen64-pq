import tkinter
from customtkinter import *
import sys
import subprocess
import frida

#Notes: it currently needs to be ran from the folder where mupen64-ui-console.exe is, so that it can get the proper plugins for stuff like video and sound etc.
#Notes: this can be changed by adding command line arguments. #TODO

#TODO:
#Remember last selected mupen64-ui-console and game, probably through a .cfg file
#Add a selector for script (and remember it)
#Give better feedback on recording
#Allow the app to be launched from anywhere, by providing command line arguments to the plugin directory
#Do something with the SQL data here
#Add customization for where to record the control data


class App(CTk):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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
        
        self.info_text = CTkTextbox(self.main_frame)
        self.info_text.grid(row=2, column=0,pady=(0, 20))

        self.exe_run_button = CTkButton(master=self.main_frame,
                                    text="Launch",
                                    command=self.run_mupen64plus)
        self.exe_run_button.grid(row=3, column=0,pady=(0, 20))

        self.record_button =CTkButton(master=self.main_frame,
                                    text="Record",
                                    command=self.record_function)
        self.record_button.grid(row=3, column=1,pady=(0, 20))

        self.okButton = CTkButton(master=self.main_frame, text="Ok", command=self.ok_function)
        self.okButton.grid(row=4, column=0, pady=(0, 20))
        self.main_frame.pack()
        #self.main_frame.pack_propagate(True)
        #self.geometry(f"{self.main_frame.winfo_width()}x{self.main_frame.winfo_height()}")

        self.exe_name = "Not Selected"
        self.game_name = "Not Selected"

        self.recording = False
        self.session = None
        self.script = None

    def _setup_frida(self):
        self.session = frida.attach("mupen64plus-ui-console.exe")
        f = open("Control Info/control_info.js", "r")
        self.script = self.session.create_script(
            f.read()
        )
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
            title="Select an N64 game",
            initialdir="./",
            filetypes=filetypes
        )
        self.update_info_text()

    def update_info_text(self):
        #maybe a better way to do this
        exe = self.exe_name
        game = self.game_name
        self.info_text.delete("0.0", "end")
        self.info_text.insert("0.0", f"mupen64plus-ui-console path: {exe}\ngame path: {game}")

    def run_mupen64plus(self):
        #should run mupen64plus-ui-console with the specified game name
        subprocess.Popen([self.exe_name, self.game_name])
        self._setup_frida()
    
    def record_function(self):
        
        if self.session is None:
            #We cannot do anything currently
            #TODO: popup
            return
        
        #stop the recording
        if self.recording:
            #TODO stop the script
            self.recording = False
            self.script.unload()
            print("Stopped Recording")
        #start the recording
        else:
            self.script.load()
            self.recording = True
            print("Started Recording")
        pass

if __name__ == "__main__":
    app = App()
    #app.geometry("400x240")
    app.mainloop()