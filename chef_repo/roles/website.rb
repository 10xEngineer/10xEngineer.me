name "website"
run_list "recipe[mongodb]", "recipe[redis]", "recipe[java]", "recipe[node]", "recipe[graphicsmagick]"