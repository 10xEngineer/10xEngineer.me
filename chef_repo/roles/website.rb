name "website"
run_list "recipe[mongo]", "recipe[redis]", "recipe[java]", "recipe[node]"