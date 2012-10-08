name "base"
run_list "recipe[apt]", "recipe[build-essential]", "recipe[git]"
